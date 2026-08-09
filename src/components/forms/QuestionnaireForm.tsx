"use client";

import {
  Field,
  SectionCard,
  SelectInput,
  TextArea,
  TextInput,
} from "@/components/fields";
import { emptyQuestion } from "@/lib/factories";
import type { Question, QuestionnaireData, QuestionType } from "@/lib/types";

const QUESTION_TYPE_OPTIONS: ReadonlyArray<{
  value: QuestionType;
  label: string;
}> = [
  { value: "short", label: "Short answer" },
  { value: "long", label: "Long answer" },
  { value: "choice", label: "Multiple choice" },
  { value: "yesno", label: "Yes / No" },
  { value: "rating", label: "Rating 1–5" },
];

interface QuestionnaireFormProps {
  data: QuestionnaireData;
  onChange: (next: QuestionnaireData) => void;
}

export function QuestionnaireForm({ data, onChange }: QuestionnaireFormProps) {
  const set = <K extends keyof QuestionnaireData>(
    key: K,
    value: QuestionnaireData[K],
  ) => onChange({ ...data, [key]: value });

  const updateQuestion = (id: string, patch: Partial<Question>) =>
    set(
      "questions",
      data.questions.map((question) =>
        question.id === id ? { ...question, ...patch } : question,
      ),
    );

  const moveQuestion = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= data.questions.length) return;
    const next = [...data.questions];
    [next[index], next[target]] = [next[target], next[index]];
    set("questions", next);
  };

  return (
    <div className="space-y-4">
      <SectionCard title="Header">
        <Field label="Title">
          <TextInput
            value={data.heading}
            onChange={(e) => set("heading", e.target.value)}
            placeholder="Client Intake Questionnaire"
          />
        </Field>
        <Field label="Introduction">
          <TextArea
            value={data.intro}
            onChange={(e) => set("intro", e.target.value)}
            placeholder="A short note explaining what this questionnaire is for."
          />
        </Field>
      </SectionCard>

      <SectionCard title="Questions">
        <div className="space-y-3">
          {data.questions.map((question, index) => (
            <div
              key={question.id}
              className="space-y-3 rounded-lg border border-neutral-200 p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-400">
                  Question {index + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveQuestion(index, -1)}
                    disabled={index === 0}
                    className="grid h-7 w-7 place-items-center rounded-md text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-30"
                    aria-label="Move question up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveQuestion(index, 1)}
                    disabled={index === data.questions.length - 1}
                    className="grid h-7 w-7 place-items-center rounded-md text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-30"
                    aria-label="Move question down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        "questions",
                        data.questions.filter(
                          (other) => other.id !== question.id,
                        ),
                      )
                    }
                    className="grid h-7 w-7 place-items-center rounded-md text-neutral-400 transition hover:bg-red-50 hover:text-red-500"
                    aria-label="Remove question"
                  >
                    ×
                  </button>
                </div>
              </div>
              <TextInput
                value={question.text}
                onChange={(e) =>
                  updateQuestion(question.id, { text: e.target.value })
                }
                placeholder="What would you like to ask?"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectInput
                  value={question.type}
                  onChange={(e) =>
                    updateQuestion(question.id, {
                      type: e.target.value as QuestionType,
                    })
                  }
                >
                  {QUESTION_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectInput>
                {question.type === "choice" ? (
                  <TextArea
                    rows={3}
                    value={question.options.join("\n")}
                    onChange={(e) =>
                      updateQuestion(question.id, {
                        options: e.target.value.split("\n"),
                      })
                    }
                    placeholder={"One option per line"}
                  />
                ) : null}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            set("questions", [...data.questions, emptyQuestion()])
          }
          className="rounded-lg border border-dashed border-neutral-300 px-3 py-2 text-sm text-neutral-500 transition hover:border-indigo-300 hover:text-indigo-600"
        >
          + Add question
        </button>
      </SectionCard>
    </div>
  );
}
