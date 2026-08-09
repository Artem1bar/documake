import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatDate } from "@/lib/format";
import type { CompanyProfile, NdaData } from "@/lib/types";
import type { PdfTheme } from "./theme";
import { faint, toLines } from "./theme";

const styles = StyleSheet.create({
  title: {
    fontSize: 15,
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 18,
  },
  paragraph: {
    textAlign: "justify",
    marginBottom: 9,
  },
  section: {
    textAlign: "justify",
    marginBottom: 9,
  },
  signatures: {
    flexDirection: "row",
    gap: 32,
    marginTop: 28,
  },
  signatureBlock: {
    flex: 1,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: faint,
    marginTop: 26,
    marginBottom: 3,
  },
});

interface NdaPdfProps {
  profile: CompanyProfile;
  data: NdaData;
  theme: PdfTheme;
}

interface Party {
  name: string;
  address: string;
}

function partyIntro(party: Party, fallback: string): string {
  const name = party.name || fallback;
  const address = toLines(party.address).join(", ");
  return address ? `${name}, with its principal place of business at ${address}` : name;
}

function buildSections(data: NdaData, partyA: string, partyB: string): Array<{ heading: string; body: string }> {
  const term =
    data.termYears === 1
      ? "one (1) year"
      : `${numberWord(data.termYears)} (${data.termYears}) years`;
  const survival = `${numberWord(data.survivalYears)} (${data.survivalYears})`;
  const definition = data.isMutual
    ? `"Confidential Information" means any non-public information disclosed by either party (the "Discloser") to the other party (the "Recipient"), in any form, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and the circumstances of disclosure. Confidential Information includes, without limitation, business plans, financial information, pricing, customer and supplier lists, product designs, technical data, software, and trade secrets.`
    : `"Confidential Information" means any non-public information disclosed by ${partyA} (the "Discloser") to ${partyB} (the "Recipient"), in any form, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and the circumstances of disclosure. Confidential Information includes, without limitation, business plans, financial information, pricing, customer and supplier lists, product designs, technical data, software, and trade secrets.`;

  return [
    { heading: "Confidential Information", body: definition },
    {
      heading: "Use and Protection",
      body: `The Recipient shall (a) use Confidential Information solely for the Purpose; (b) not disclose Confidential Information to any third party, except to its employees, contractors, and professional advisors who need to know it for the Purpose and who are bound by confidentiality obligations at least as protective as those in this Agreement; and (c) protect Confidential Information using at least the same degree of care it uses to protect its own confidential information, and in no event less than reasonable care.`,
    },
    {
      heading: "Exclusions",
      body: `The obligations in this Agreement do not apply to information that (a) is or becomes publicly available through no fault of the Recipient; (b) was rightfully known to the Recipient without restriction before disclosure; (c) is independently developed by the Recipient without use of or reference to the Confidential Information; or (d) is rightfully received from a third party without a duty of confidentiality.`,
    },
    {
      heading: "Compelled Disclosure",
      body: `The Recipient may disclose Confidential Information to the extent required by law, regulation, or court order, provided that, where legally permitted, it gives the Discloser prompt written notice and reasonable assistance to contest or limit the required disclosure.`,
    },
    {
      heading: "Term",
      body: `This Agreement commences on the Effective Date and continues for ${term}, unless terminated earlier by either party on thirty (30) days' written notice. Each party's obligations with respect to Confidential Information survive for ${survival} years after the date of disclosure; obligations regarding trade secrets survive for as long as the information remains a trade secret under applicable law.`,
    },
    {
      heading: "Return of Materials",
      body: `Upon the Discloser's written request, the Recipient shall promptly return or destroy all Confidential Information and certify such destruction in writing, except for copies retained pursuant to standard backup procedures or legal requirements, which remain subject to this Agreement.`,
    },
    {
      heading: "No License; No Obligation",
      body: `No license or other rights in or to any Confidential Information or intellectual property are granted under this Agreement, except the limited right to use Confidential Information for the Purpose. Nothing in this Agreement obligates either party to disclose any information or to enter into any further agreement or business relationship.`,
    },
    {
      heading: "No Warranty",
      body: `All Confidential Information is provided "AS IS", without any warranty of accuracy, completeness, or fitness for a particular purpose.`,
    },
    {
      heading: "Remedies",
      body: `The parties acknowledge that unauthorized use or disclosure of Confidential Information may cause irreparable harm for which monetary damages would be an inadequate remedy, and that the Discloser is entitled to seek injunctive or other equitable relief in addition to any other remedies available at law.`,
    },
    {
      heading: "General",
      body: `This Agreement is governed by the laws of ${data.governingLaw || "[governing law]"}, without regard to its conflict-of-laws rules. This Agreement is the entire agreement between the parties regarding its subject matter and supersedes all prior discussions. It may be amended only in a writing signed by both parties, and may be executed in counterparts. Neither party may assign this Agreement without the other party's prior written consent, except to a successor in connection with a merger or sale of substantially all of its assets.`,
    },
  ];
}

const NUMBER_WORDS = [
  "zero", "one", "two", "three", "four", "five",
  "six", "seven", "eight", "nine", "ten",
] as const;

function numberWord(value: number): string {
  return NUMBER_WORDS[value] ?? String(value);
}

function SignatureBlock({ name, theme }: { name: string; theme: PdfTheme }) {
  return (
    <View style={styles.signatureBlock}>
      <Text style={theme.styles.bold}>{name || "________________________"}</Text>
      <View style={styles.signatureLine} />
      <Text style={theme.styles.small}>Signature</Text>
      <View style={styles.signatureLine} />
      <Text style={theme.styles.small}>Name and title</Text>
      <View style={styles.signatureLine} />
      <Text style={theme.styles.small}>Date</Text>
    </View>
  );
}

export function NdaPdf({ profile, data, theme }: NdaPdfProps) {
  const pdfStyles = theme.styles;
  const partyAName = profile.name || "[Your Company]";
  const partyBName = data.partyBName || "[Counterparty]";
  const sections = buildSections(data, partyAName, partyBName);
  const roleA = data.isMutual ? "" : " (the “Disclosing Party”)";
  const roleB = data.isMutual ? "" : " (the “Receiving Party”)";

  return (
    <Document
      title={data.isMutual ? "Mutual Non-Disclosure Agreement" : "Non-Disclosure Agreement"}
      author={profile.name}
    >
      <Page size="A4" style={pdfStyles.page}>
        <Text
          style={[
            styles.title,
            { fontFamily: theme.font.bold, color: theme.accent },
          ]}
        >
          {data.isMutual ? "MUTUAL NON-DISCLOSURE AGREEMENT" : "NON-DISCLOSURE AGREEMENT"}
        </Text>

        <Text style={styles.paragraph}>
          This {data.isMutual ? "Mutual " : ""}Non-Disclosure Agreement (the
          {" “Agreement”"}) is entered into as of{" "}
          {formatDate(data.effectiveDate) || "[date]"} (the
          {" “Effective Date”"}) by and between{" "}
          {partyIntro({ name: partyAName, address: profile.address }, "[Your Company]")}
          {roleA}, and{" "}
          {partyIntro({ name: partyBName, address: data.partyBAddress }, "[Counterparty]")}
          {roleB} (each a {"“party”"} and together the {"“parties”"}).
        </Text>

        <Text style={styles.paragraph}>
          The parties wish to exchange certain confidential information for the
          purpose of {data.purpose || "[purpose]"} (the {"“Purpose”"}), and
          agree as follows:
        </Text>

        {sections.map((section, index) => (
          <Text key={section.heading} style={styles.section}>
            <Text style={pdfStyles.bold}>
              {index + 1}. {section.heading}.{" "}
            </Text>
            {section.body}
          </Text>
        ))}

        <Text style={styles.paragraph}>
          IN WITNESS WHEREOF, the parties have executed this Agreement as of the
          Effective Date.
        </Text>

        <View style={styles.signatures} wrap={false}>
          <SignatureBlock name={partyAName} theme={theme} />
          <SignatureBlock name={partyBName} theme={theme} />
        </View>

        <View style={pdfStyles.footer} fixed>
          <Text>
            {data.isMutual ? "Mutual NDA" : "NDA"} — {partyAName} / {partyBName}
          </Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
