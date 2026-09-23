import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background circuit-pattern px-4">
      <div className="relative z-10 text-center">
        <Link href="/" className="inline-flex mb-8">
          <Image
            src="/uds-logo.png"
            alt="UNILAG Design Studio — Innovation Hub"
            width={273}
            height={142}
            priority
            className="h-14 w-auto object-contain"
          />
        </Link>
        <h1 className="font-display mb-3 text-6xl font-bold text-brand-oxblood">404</h1>
        <p className="mb-8 text-lg text-muted-foreground">
          We couldn&apos;t find that page.
        </p>
        <Link
          href="/"
          className="uds-btn uds-btn-gold inline-flex items-center justify-center text-base"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
