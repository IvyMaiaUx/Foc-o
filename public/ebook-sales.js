(() => {
  const reveal = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .1 });
    reveal.forEach(element => observer.observe(element));
  } else {
    reveal.forEach(element => element.classList.add('in'));
  }

  const hero = document.querySelector('.hero');
  const sticky = document.querySelector('.sticky');
  if (hero && sticky && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      sticky.classList.toggle('show', !entry.isIntersecting);
    }, { threshold: 0 }).observe(hero);
  }

  const current = new URLSearchParams(window.location.search);
  let attribution = {};
  try { attribution = JSON.parse(localStorage.getItem('fct_attr') || '{}'); } catch (_) {}
  document.querySelectorAll('a[data-checkout]').forEach(link => {
    const url = new URL(link.href);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'].forEach(key => {
      const value = attribution[key] || current.get(key);
      if (value && !url.searchParams.has(key)) url.searchParams.set(key, String(value).slice(0, 160));
    });
    link.href = url.toString();
  });
})();

