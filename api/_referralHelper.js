import { admin } from './_firebase.js';
import { enqueueAndSendWhatsappNotification } from './_whatsapp.js';

function nowMs() {
  return Date.now();
}

export async function checkAndProcessReferral(db, referredUid) {
  try {
    // 1. Fetch the friend (referee) user profile
    const friendRef = db.collection('users').doc(referredUid);
    const friendSnap = await friendRef.get();
    if (!friendSnap.exists) {
      return { status: 'friend_not_found' };
    }

    const friendData = friendSnap.data();
    const referredByCode = friendData.referredBy;

    if (!referredByCode) {
      return { status: 'no_referral_code' };
    }

    // 2. Fetch the referrer's profile by referralCode
    const referrersQuery = await db.collection('users')
      .where('referralCode', '==', referredByCode)
      .limit(1)
      .get();

    if (referrersQuery.empty) {
      console.warn(`[ReferralHelper] Referrer with code ${referredByCode} not found.`);
      return { status: 'referrer_not_found' };
    }

    const referrerDoc = referrersQuery.docs[0];
    const referrerUid = referrerDoc.id;
    const referrerData = referrerDoc.data();

    const referralId = `${referrerUid}_${referredUid}`;
    const referralRef = db.collection('referrals').doc(referralId);
    const referralSnap = await referralRef.get();

    let referralData = referralSnap.exists ? referralSnap.data() : null;

    // 3. Initialize referral if it doesn't exist
    if (!referralData) {
      referralData = {
        referrerUid,
        referredUid,
        status: 'pending',
        onboardingCompleted: false,
        checkinsCompleted: 0,
        premiumActivated: false,
        paymentConfirmed: false,
        rewardGranted: false,
        createdAt: admin.firestore.Timestamp.now(),
        convertedAt: null,
        rewardedAt: null
      };
      await referralRef.set(referralData);
    }

    // 4. Check if already rewarded or invalid
    if (referralData.rewardGranted || referralData.status === 'rewarded') {
      return { status: 'already_rewarded' };
    }

    if (referralData.status === 'invalid') {
      return { status: 'already_invalid' };
    }

    // 5. Anti-Fraud Validations
    let isFraud = false;
    let fraudReason = '';

    // A. Self-referral
    if (referrerUid === referredUid) {
      isFraud = true;
      fraudReason = 'Self-referral';
    }

    // B. Same Email
    if (friendData.email && referrerData.email &&
        friendData.email.trim().toLowerCase() === referrerData.email.trim().toLowerCase()) {
      isFraud = true;
      fraudReason = 'Same email address';
    }

    // C. Repeat WhatsApp Phone Number
    if (friendData.whatsappPhone && friendData.whatsappPhone.trim()) {
      const friendPhone = friendData.whatsappPhone.trim();
      
      // Check if referrer has same phone
      if (referrerData.whatsappPhone && referrerData.whatsappPhone.trim() === friendPhone) {
        isFraud = true;
        fraudReason = 'Same phone number as referrer';
      } else {
        // Check if there are other user accounts with this phone
        const phoneQuery = await db.collection('users')
          .where('whatsappPhone', '==', friendPhone)
          .get();
        if (phoneQuery.size > 1) {
          isFraud = true;
          fraudReason = 'Phone number registered in multiple accounts';
        }
      }
    }

    // D. Repeat Stripe Customer ID
    const friendCustId = friendData.subscription?.stripeCustomerId || friendData.stripeCustomerId;
    if (friendCustId) {
      // Check if matches referrer customer ID
      const referrerCustId = referrerData.subscription?.stripeCustomerId || referrerData.stripeCustomerId;
      if (referrerCustId === friendCustId) {
        isFraud = true;
        fraudReason = 'Same Stripe Customer ID as referrer';
      } else {
        // Check if another account has the same Stripe Customer ID
        const custQuery = await db.collection('users')
          .where('subscription.stripeCustomerId', '==', friendCustId)
          .get();
        const legacyQuery = await db.collection('users')
          .where('stripeCustomerId', '==', friendCustId)
          .get();
        if (custQuery.size + legacyQuery.size > 1) {
          isFraud = true;
          fraudReason = 'Stripe Customer ID associated with multiple accounts';
        }
      }
    }

    if (isFraud) {
      console.warn(`[ReferralHelper] Fraud detected for referral ${referralId}: ${fraudReason}`);
      await referralRef.update({
        status: 'invalid',
        fraudReason,
        updatedAt: admin.firestore.Timestamp.now()
      });
      return { status: 'invalid', reason: fraudReason };
    }

    // 6. Gather current progress metrics
    const onboardingCompleted = friendData.onboardingComplete || false;
    
    // Count checkins in users/{friendId}/checkins
    const checkinsSnap = await db.collection('users').doc(referredUid).collection('checkins').get();
    const dailyCheckinsSnap = await db.collection('users').doc(referredUid).collection('dailyCheckins').get();
    const checkinsCompleted = checkinsSnap.size + dailyCheckinsSnap.size;

    // Check premium activation from Stripe/subscription data
    const subscriptionStatus = friendData.subscription?.status;
    const premiumActivated = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';
    const paymentConfirmed = subscriptionStatus === 'active';

    // Check if referrer already reached limit of 3 valid referrals
    const referralsLimitReached = referrerData.referralsLimitReached || (referrerData.validReferrals >= 3);

    // 8. Re-evaluate referral status
    let currentStatus = 'pending';
    if (paymentConfirmed) {
      currentStatus = 'converted';
    } else if (onboardingCompleted) {
      currentStatus = 'activated';
    }

    const updates = {
      onboardingCompleted,
      checkinsCompleted,
      premiumActivated,
      paymentConfirmed,
      status: currentStatus,
      updatedAt: admin.firestore.Timestamp.now()
    };

    // 9. Grant reward if all conditions are met
    if (onboardingCompleted && checkinsCompleted >= 2 && paymentConfirmed) {
      // Qualifies!
      // Run Transaction to apply reward
      const transactionResult = await db.runTransaction(async (transaction) => {
        const freshReferrerSnap = await transaction.get(referrerDoc.ref);
        const freshReferrer = freshReferrerSnap.data();

        const freshReferralsLimitReached = freshReferrer.referralsLimitReached || (freshReferrer.validReferrals >= 3);

        if (freshReferralsLimitReached) {
          transaction.set(referralRef, {
            ...updates,
            status: 'rewarded',
            rewardGranted: true,
            rewardedAt: admin.firestore.Timestamp.now(),
            convertedAt: referralData.convertedAt || admin.firestore.Timestamp.now(),
            note: 'Referrer limit reached, no premium days added.'
          }, { merge: true });

          return { status: 'referrer_limit_reached' };
        }

        // Add 7 days to referrer
        const newValidReferrals = (freshReferrer.validReferrals || 0) + 1;
        const newRewardsDays = (freshReferrer.referralRewardsDays || 0) + 7;
        const newLimitReached = newValidReferrals >= 3;

        let referrerExpiresAt = freshReferrer.premiumBonusExpiresAt || nowMs();
        if (referrerExpiresAt < nowMs()) referrerExpiresAt = nowMs();
        const newReferrerExpiresAt = referrerExpiresAt + (7 * 24 * 60 * 60 * 1000);

        transaction.update(referrerDoc.ref, {
          validReferrals: newValidReferrals,
          referralRewardsDays: newRewardsDays,
          referralsLimitReached: newLimitReached,
          premiumBonusDays: admin.firestore.FieldValue.increment(7),
          premiumBonusExpiresAt: newReferrerExpiresAt,
          updatedAt: nowMs()
        });

        transaction.set(referralRef, {
          ...updates,
          status: 'rewarded',
          rewardGranted: true,
          rewardedAt: admin.firestore.Timestamp.now(),
          convertedAt: referralData.convertedAt || admin.firestore.Timestamp.now()
        }, { merge: true });

        // Enqueue System Audit Log
        const auditLogRef = db.collection('adminAuditLogs').doc();
        transaction.set(auditLogRef, {
          adminEmail: 'system',
          module: 'Usuários',
          action: 'Indicação Premiada',
          details: `Indicador:\n${referrerData.name || 'Tutor'}\n\nIndicado:\n${friendData.name || 'Amigo'}\n\nRecompensa:\n+7 dias Premium\n\nStatus:\nConcluído`,
          userId: referrerUid,
          timestamp: nowMs()
        });

        // Register telemetry analytics event
        const telemetryRef = db.collection('analytics_events').doc();
        transaction.set(telemetryRef, {
          eventName: 'referral_reward_granted',
          userId: referredUid,
          referrerUid,
          createdAt: admin.firestore.Timestamp.now(),
          metadata: {
            referrerName: referrerData.name || 'Tutor',
            friendName: friendData.name || 'Amigo',
            rewardDays: 7
          }
        });

        // In-App Notification for Referrer (Indicator)
        const referrerNotifRef = db.collection('users').doc(referrerUid).collection('notifications').doc(referralId);
        const expiresDateStr = new Date(newReferrerExpiresAt).toLocaleDateString('pt-BR');
        transaction.set(referrerNotifRef, {
          title: '🎉 Você ganhou 7 dias Premium!',
          body: `${friendData.name || 'Seu amigo'} concluiu a jornada e ativou o Premium. Seus benefícios foram estendidos até ${expiresDateStr}. Você já acumulou ${newRewardsDays} dias extras.`,
          type: 'referral_reward_indicator',
          friendName: friendData.name || 'Amigo',
          newExpiresAt: expiresDateStr,
          referralRewardsDays: newRewardsDays,
          notifyAt: new Date().toISOString(),
          read: false,
          createdAt: nowMs()
        });

        // In-App Notification for Referee (Friend)
        const refereeNotifRef = db.collection('users').doc(referredUid).collection('notifications').doc(referralId);
        transaction.set(refereeNotifRef, {
          title: '🎉 Obrigado por apoiar o Focão!',
          body: `Sua assinatura foi ativada com sucesso. Além disso, ${referrerData.name || 'Tutor'} (que te convidou) acabou de receber +7 dias Premium graças à sua indicação. 🐶💛`,
          type: 'referral_reward_referee',
          referrerName: referrerData.name || 'Tutor',
          notifyAt: new Date().toISOString(),
          read: false,
          createdAt: nowMs()
        });

        // O envio real do WhatsApp acontece fora da transação (é chamada externa).
        return {
          status: 'reward_granted',
          validReferrals: newValidReferrals,
          referrerUid,
          referrerName: referrerData.name || 'Tutor',
          friendName: friendData.name || 'Amigo',
          rewardsDays: newRewardsDays,
          expiresDateStr,
        };
      });

      // WhatsApp de recompensa para o indicador — envio real via ZapResponder.
      // Antes isto só gravava um doc 'pending'/'mock' que nunca era disparado.
      if (transactionResult?.status === 'reward_granted') {
        try {
          await enqueueAndSendWhatsappNotification({
            userId: transactionResult.referrerUid,
            type: 'referral_reward',
            templateName: 'referral_reward',
            payload: {
              tutorName: transactionResult.referrerName,
              friendName: transactionResult.friendName,
              referralRewardsDays: transactionResult.rewardsDays,
              message: `🎉 Boas notícias, ${transactionResult.referrerName}! ${transactionResult.friendName} ativou o Premium pela sua indicação e você ganhou +7 dias Premium (total de ${transactionResult.rewardsDays} dias acumulados). Seus benefícios valem até ${transactionResult.expiresDateStr}. Obrigado por espalhar o Focão! 🐶💛`,
            },
          });
        } catch (whatsappError) {
          console.warn('[ReferralHelper] Falha ao enviar WhatsApp de recompensa:', whatsappError.message);
        }
      }

      return transactionResult;
    }

    // Just update referral state
    await referralRef.set(updates, { merge: true });
    return { status: currentStatus, onboardingCompleted, checkinsCompleted, paymentConfirmed };

  } catch (error) {
    console.error('[ReferralHelper] Error processing referral check:', error);
    throw error;
  }
}
