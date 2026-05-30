import { Wordmark } from "@/src/components/branding/Wordmark";

interface BrandLogoProps {
  tone?: "dark" | "light";
  width?: number;
}

export function BrandLogo({ tone = "dark", width = 112 }: BrandLogoProps) {
  return <Wordmark tone={tone} width={width} />;
}
