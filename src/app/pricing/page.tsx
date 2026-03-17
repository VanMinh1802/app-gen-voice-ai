/**
 * Pricing Page
 *
 * Displays available plans. Uses Genation SDK for auth and license.
 */
"use client";

import { Check, Sparkles, Crown, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuthContext } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";

interface PlanData {
  code: string;
  name: string;
  price: string;
  description: string;
  features: { text: string; included: boolean }[];
  popular?: boolean;
}

const PLANS: PlanData[] = [
  {
    code: "FREE",
    name: "Miễn phí",
    price: "0đ",
    description: "Dành cho người mới bắt đầu",
    features: [
      { text: "1 model giọng nam + 1 model giọng nữ", included: true },
      { text: "Xuất WAV", included: true },
      { text: "Tất cả model giọng còn lại", included: false },
    ],
  },
  {
    code: "PRO",
    name: "Pro",
    price: "100.000đ",
    description: "Dành cho người dùng thường xuyên",
    features: [
      { text: "Tất cả model giọng", included: true },
      { text: "Xuất WAV", included: true },
      { text: "Hỗ trợ ưu tiên", included: true },
    ],
    popular: true,
  },
];

function PlanCard({
  plan,
  isCurrentPlan,
  onSelect,
  isLoading,
  activePlanCode,
}: {
  plan: PlanData;
  isCurrentPlan: boolean;
  onSelect: () => void;
  isLoading: boolean;
  activePlanCode: string | null;
}) {
  const Icon = plan.code === "FREE" ? Sparkles : Crown;
  const showFreeCurrentBadge = plan.code === "FREE" && activePlanCode !== "PRO";
  return (
    <div
      className={cn(
        "relative flex flex-col p-6 rounded-3xl border-2 transition-all duration-300",
        plan.popular
          ? "border-primary bg-primary/5 shadow-lg shadow-primary/20 md:scale-105"
          : "border-border bg-card hover:border-primary/50 hover:shadow-lg"
      )}
    >
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-full shadow-lg">
          Phổ biến nhất
        </div>
      )}
      <div className="text-center mb-6 relative">
        <div
          className={cn(
            "w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center",
            plan.popular ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
          )}
        >
          <Icon className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
        <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
        {showFreeCurrentBadge && (
          <span className="absolute right-4 top-3 text-[10px] font-bold uppercase tracking-[0.2em] text-primary bg-primary/10 px-3 py-1 rounded-full">
            Gói hiện tại
          </span>
        )}
      </div>
      <div className="text-center mb-6">
        <span className="text-4xl font-bold text-foreground">{plan.price}</span>
        <span className="text-muted-foreground">/tháng</span>
      </div>
      <ul className="flex-1 space-y-3 mb-6">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-center gap-3">
            <div
              className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                feature.included ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground/50"
              )}
            >
              {feature.included ? <Check className="w-3 h-3" strokeWidth={3} /> : <span className="text-xs">×</span>}
            </div>
            <span className={cn("text-sm", feature.included ? "text-foreground" : "text-muted-foreground/50")}>
              {feature.text}
            </span>
          </li>
        ))}
      </ul>
      <button
        onClick={onSelect}
        disabled={isCurrentPlan || isLoading}
        className={cn(
          "w-full py-3 px-6 rounded-xl font-medium transition-all duration-200",
          isCurrentPlan
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : plan.popular
              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
              : "bg-primary/10 text-primary hover:bg-primary/20"
        )}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
        ) : isCurrentPlan ? (
          "Đang sử dụng"
        ) : (
          "Mua ngay"
        )}
      </button>
    </div>
  );
}

export default function PricingPage() {
  const { isAuthenticated, signIn, activePlanCode, isLoading: isLicenseLoading } = useAuthContext();

  const handleSelectPlan = async (planCode: string) => {
    if (!isAuthenticated) {
      await signIn();
      return;
    }
    if (planCode !== "FREE" && activePlanCode !== planCode) {
      // Redirect to Genation store (replace with actual store URL when available)
      const storeUrl = process.env.NEXT_PUBLIC_GENATION_STORE_URL || "https://genation.ai";
      window.location.href = `${storeUrl}?plan=${planCode}`;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Quay lại</span>
            </Link>
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">
                GenVoice <span className="text-primary">AI</span>
              </span>
            </div>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">Chọn gói phù hợp với bạn</h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Tất cả các gói đều bao gồm quyền truy cập TTS tiên tiến. Nâng cấp để mở khóa thêm tính năng.
          </p>
        </div>
      </section>

      <section className="pb-16 sm:pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start max-w-4xl mx-auto">
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.code}
                plan={plan}
                isCurrentPlan={activePlanCode === plan.code}
                onSelect={() => handleSelectPlan(plan.code)}
                isLoading={isLicenseLoading}
                activePlanCode={activePlanCode}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">Câu hỏi thường gặp</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Làm thế nào để thanh toán?</h3>
              <p className="text-muted-foreground">
                Thanh toán qua Genation Store. Bạn có thể dùng MoMo, ZaloPay hoặc thẻ ngân hàng.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Tôi có thể hủy gói không?</h3>
              <p className="text-muted-foreground">Có. Bạn có thể hủy bất kỳ lúc nào từ tài khoản Genation.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
