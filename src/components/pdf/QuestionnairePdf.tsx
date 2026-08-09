import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { CompanyProfile, Question, QuestionnaireData } from "@/lib/types";
import { faint, muted, pdfStyles } from "./theme";

const styles = StyleSheet.create({
  company: {
    fontSize: 8.5,
    color: muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  heading: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  intro: {
    color: muted,
    marginBottom: 4,
  },
  respondent: {
    flexDirection: "row",
    gap: 24,
    marginTop: 14,
    marginBottom: 6,
  },
  respondentField: {
    flex: 1,
  },
  question: {
    marginTop: 16,
  },
  questionText: {
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  answerLine: {
    borderBottomWidth: 1,
    borderBottomColor: faint,
    height: 18,
  },
  answerBox: {
    borderWidth: 1,
    borderColor: faint,
    borderRadius: 3,
    height: 84,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 6,
  },
  checkbox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: muted,
    borderRadius: 2,
  },
  inlineOptions: {
    flexDirection: "row",
    gap: 22,
  },
});

function AnswerArea({ question }: { question: Question }) {
  switch (question.type) {
    case "short":
      return <View style={styles.answerLine} />;
    case "long":
      return <View style={styles.answerBox} />;
    case "choice": {
      const options = question.options
        .map((option) => option.trim())
        .filter((option) => option.length > 0);
      return (
        <View>
          {options.map((option, index) => (
            <View key={`${index}-${option}`} style={styles.optionRow}>
              <View style={styles.checkbox} />
              <Text>{option}</Text>
            </View>
          ))}
        </View>
      );
    }
    case "yesno":
      return (
        <View style={styles.inlineOptions}>
          {["Yes", "No"].map((option) => (
            <View key={option} style={styles.optionRow}>
              <View style={styles.checkbox} />
              <Text>{option}</Text>
            </View>
          ))}
        </View>
      );
    case "rating":
      return (
        <View style={styles.inlineOptions}>
          {[1, 2, 3, 4, 5].map((value) => (
            <View key={value} style={styles.optionRow}>
              <View style={styles.checkbox} />
              <Text>{value}</Text>
            </View>
          ))}
        </View>
      );
  }
}

interface QuestionnairePdfProps {
  profile: CompanyProfile;
  data: QuestionnaireData;
}

export function QuestionnairePdf({ profile, data }: QuestionnairePdfProps) {
  return (
    <Document title={data.heading || "Questionnaire"} author={profile.name}>
      <Page size="A4" style={pdfStyles.page}>
        {profile.name ? (
          <Text style={styles.company}>{profile.name}</Text>
        ) : null}
        <Text style={styles.heading}>{data.heading || "Questionnaire"}</Text>
        {data.intro ? <Text style={styles.intro}>{data.intro}</Text> : null}

        <View style={styles.respondent}>
          <View style={styles.respondentField}>
            <Text style={pdfStyles.label}>Name</Text>
            <View style={styles.answerLine} />
          </View>
          <View style={styles.respondentField}>
            <Text style={pdfStyles.label}>Date</Text>
            <View style={styles.answerLine} />
          </View>
        </View>

        {data.questions.map((question, index) => (
          <View key={question.id} style={styles.question} wrap={false}>
            <Text style={styles.questionText}>
              {index + 1}. {question.text || "…"}
            </Text>
            <AnswerArea question={question} />
          </View>
        ))}

        <View style={pdfStyles.footer} fixed>
          <Text>
            {data.heading || "Questionnaire"}
            {profile.name ? ` — ${profile.name}` : ""}
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
