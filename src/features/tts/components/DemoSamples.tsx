"use client";

import { useLocale } from "@/lib/hooks/useLocale";

interface DemoSamplesProps {
  onSelect: (text: string) => void;
}

export function DemoSamples({ onSelect }: DemoSamplesProps) {
  const { t, effectiveLocale } = useLocale();

  const demos = {
    vi: [
      {
        text: "Con đang quán chiếu con là một cây hoa bồ công anh. Mỗi ngày con phơi những cánh lá của con trong không gian và tiếp thu tất cả những mầu nhiệm của sự sống.",
        speaker: "Mẫu chuẩn",
      },
      {
        text: "Hôm nay trời đẹp quá! Tôi muốn đi dạo công viên và tận hưởng không khí trong lành của buổi sáng.",
        speaker: "Hội thoại",
      },
      {
        text: "Giá cả thị trường chứng khoán biến động liên tục. Nhà đầu tư cần theo dõi sát sao các chỉ số và đưa ra quyết định kịp thời.",
        speaker: "Tin tức",
      },
    ],
    en: [
      {
        text: "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the English alphabet.",
        speaker: "Pangram",
      },
      {
        text: "Good morning! The weather is beautiful today. I would like to take a walk in the park and enjoy the fresh morning air.",
        speaker: "Conversation",
      },
      {
        text: "Technology has revolutionized the way we communicate, work, and live. Artificial intelligence is transforming industries across the globe.",
        speaker: "Technology",
      },
    ],
  };

  const currentDemos = effectiveLocale === "en" ? demos.en : demos.vi;

  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium mb-3 text-muted-foreground">
        {effectiveLocale === "vi" ? "Mẫu văn bản" : "Sample texts"}
      </h3>
      <div className="flex flex-wrap gap-2">
        {currentDemos.map((demo, index) => (
          <button
            key={index}
            onClick={() => onSelect(demo.text)}
            className="px-3 py-2 text-sm border rounded-lg hover:bg-accent hover:border-primary transition-colors text-left"
            title={demo.text}
          >
            <span className="font-medium">{demo.speaker}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
