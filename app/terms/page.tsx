import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for using Plastik Record Store",
}

export default function TermsPage() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold mb-8">Terms & Conditions</h1>
      <div className="prose dark:prose-invert">
        <h2>1. Introduction</h2>
        <p>
          Welcome to Plastik Records. By accessing and using this website, you accept and agree to be bound by the terms
          and provision of this agreement.
        </p>

        <h2>2. Use License</h2>
        <p>
          Permission is granted to temporarily download one copy of the materials (information or software) on Plastik
          Records&apos;s website for personal, non-commercial transitory viewing only.
        </p>

        <h2>3. Disclaimer</h2>
        <p>
          The materials on Plastik Records&apos;s website are provided on an &apos;as is&apos; basis. Plastik Records
          makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including,
          without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or
          non-infringement of intellectual property or other violation of rights.
        </p>

        <h2>4. Limitations</h2>
        <p>
          In no event shall Plastik Records or its suppliers be liable for any damages (including, without limitation,
          damages for loss of data or profit, or due to business interruption) arising out of the use or inability to
          use the materials on Plastik Records&apos;s website.
        </p>

        <h2>5. Accuracy of Materials</h2>
        <p>
          The materials appearing on Plastik Records&apos;s website could include technical, typographical, or
          photographic errors. Plastik Records does not warrant that any of the materials on its website are accurate,
          complete or current.
        </p>
      </div>
    </div>
  )
}

