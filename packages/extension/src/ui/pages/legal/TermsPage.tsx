import React from "react";
import { Link } from "react-router-dom";
import { LegalLayout } from "../../components/LegalLayout.js";

export function TermsPage() {
  return (
    <LegalLayout title="Terms of Use" icon="file" lastUpdated="September 17, 2026">
      <p className="af-muted" style={{ marginTop: -8, fontSize: 12.5 }}>
        Effective date: September 17, 2026
      </p>
      <p>
        These Terms of Use ("Terms") govern your use of Treco, a free, open-source browser extension. Treco is a
        personal, non-commercial project developed and maintained by an individual developer based in Hungary - not
        a company, and not operated through any registered business entity. By installing or using Treco, you agree
        to these Terms. If you don't agree, please don't use the extension.
      </p>

      <h2>1. Acceptance of terms</h2>
      <p>
        By installing, enabling, or otherwise using Treco, you confirm that you have read, understood, and agree to be bound
        by these Terms and by the <Link to="/legal/privacy-policy">Privacy Policy</Link>.
      </p>

      <h2>2. Description of the project</h2>
      <p>
        Treco is a free, open-source browser extension that observes your usage of supported AI websites, estimates the
        tokens, energy, CO2e and water associated with that usage, and presents that information back to you locally through
        a dashboard and popup. Treco runs entirely on your device. It is provided free of charge, with no paid tier, no
        advertising, no account system, and no server-side component of any kind.
      </p>

      <h2>3. Your responsibilities</h2>
      <ul>
        <li>You're responsible for how you configure and use Treco, including which providers you enable.</li>
        <li>You're responsible for complying with the terms of service of any AI provider or website you use alongside Treco.</li>
        <li>You should keep your browser and the extension reasonably up to date to benefit from fixes and improvements.</li>
      </ul>

      <h2>4. Appropriate use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use Treco to interfere with, disrupt, or attempt unauthorized access to any AI provider's systems.</li>
        <li>Misrepresent Treco's estimates as certified, audited, or scientifically exact measurements.</li>
        <li>Use Treco in any way that violates applicable law.</li>
      </ul>

      <h2>5. Open source, intellectual property and branding</h2>
      <p>
        Treco's source code is public and licensed under the MIT License - see the{" "}
        <Link to="/legal/licenses">Open Source</Link> page for the license text and third-party component
        attributions. The MIT License governs your rights to copy, modify, and redistribute the code itself, and
        these Terms separately govern your use of the extension as distributed to you (for example, through a
        browser's extension store).
      </p>
      <p>
        The "Treco" name and any associated logo are used to identify this project; no trademark registration is claimed at
        this time.
      </p>

      <h2>6. Third-party AI providers</h2>
      <p>
        Treco observes your usage of third-party AI websites (for example, ChatGPT, Claude, Gemini, and others listed in
        Settings). Treco is not affiliated with, endorsed by, or operated by any of these providers. The developer does not
        control, and is not responsible for, the accuracy, availability, pricing, APIs, interfaces, or policies of any
        third-party AI provider. Changes those providers make to their websites may affect Treco's ability to detect usage
        correctly.
      </p>

      <h2>7. Environmental estimates are informational</h2>
      <p>
        The energy, CO2e and water figures shown by Treco are estimates for informational purposes only. They are not
        certified measurements, are not produced or verified by the AI providers themselves, and should not be treated as
        scientifically exact. They should not be relied upon for regulatory, compliance, financial, or scientific reporting
        purposes without independent verification. See the in-app Methodology page and the{" "}
        <Link to="/legal/privacy-policy">Privacy Policy</Link> for how these figures are derived.
      </p>

      <h2>8. No warranty; provided "as is"</h2>
      <p>
        Treco is free, open-source software provided "as is" and "as available," without warranties of any kind, express or
        implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or
        non-infringement. There is no guarantee that Treco will operate uninterrupted, error-free, or compatible with every
        version of every supported AI website, or that its usage detection or estimates will always be accurate or complete.
        As a personal project, Treco is maintained on a best-effort, volunteer basis with no service-level commitment.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by applicable law, the developer of Treco will not be liable for any indirect,
        incidental, special, consequential, or punitive damages, or any loss of data, arising out of or related to your use
        of, or inability to use, Treco - including reliance on any environmental estimate it produces. Nothing in these Terms
        limits liability where it cannot be limited under applicable law.
      </p>

      <h2>10. Changes to the project and these Terms</h2>
      <p>
        Features of Treco may change, be added, or be removed at any time, as is typical of an actively developed
        open-source project. These Terms may also be revised from time to time; material changes will be reflected in the
        "Last updated" date above and, where appropriate, noted inside the extension. Continuing to use Treco after a
        revision takes effect means you accept the updated Terms.
      </p>

      <h2>11. Ending your use</h2>
      <p>
        You may stop using Treco at any time by disabling or uninstalling the extension. As a free, volunteer-maintained
        project, development or distribution of Treco could be paused or discontinued at any time (for example, if a
        browser's extension store policies changed), with no guarantee of continued availability.
      </p>

      <h2>12. Governing law</h2>
      <p>
        These Terms are governed by the laws of Hungary, without regard to its conflict-of-laws principles, unless a
        different jurisdiction is required by applicable consumer-protection law where you live.
      </p>

      <h2>13. Contact</h2>
      <p>
        See the <Link to="/legal/contact">Contact</Link> page for the current ways to reach the developer about these Terms -
        the project's public GitHub repository is the primary channel.
      </p>
    </LegalLayout>
  );
}
