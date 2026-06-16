"use client";

import { Check, Zap, Clock, Star } from "lucide-react";

interface PremiumTabProps {
  onPlanClick: (type: "free" | "monthly" | "annual") => void;
  currentPlan: string;
}

export default function PremiumTab({ onPlanClick, currentPlan }: PremiumTabProps) {
  const plans = [
    {
      id: "free" as const,
      name: "Gratuit",
      price: "0",
      period: "",
      features: [
        "10 mesaje chat/zi",
        "10 răspunsuri teste/zi",
        "1 rezumat/zi",
        "1 quiz din document/zi",
        "Progres de bază",
      ],
      popular: false,
      buttonText: "Plan curent",
      active: currentPlan === "free",
      highlight: "Începe gratis",
    },
    {
      id: "monthly" as const,
      name: "Premium Lunar",
      price: "19",
      period: "/lună",
      originalPrice: "49",
      features: [
        "Mesaje nelimitate chat AI",
        "Teste și răspunsuri nelimitate",
        "Rezumate și quiz-uri nelimitate",
        "Progres detaliat și statistici",
        "Fără reclame",
        "Suport prioritar",
      ],
      popular: true,
      buttonText:
        currentPlan === "premium" || currentPlan === "annual"
          ? "Plan curent"
          : "Alege Premium",
      active: currentPlan === "premium" || currentPlan === "annual",
      highlight: "OFERTĂ LIMITATĂ — prima lună",
      sublabel: "apoi 49 lei/lună",
    },
    {
      id: "annual" as const,
      name: "Anual",
      price: "35",
      period: "/lună",
      features: [
        "Tot ce include Premium Lunar",
        "Economisești 168 lei pe an",
        "Facturat anual (420 lei)",
        "Preț blocat, fără creșteri",
      ],
      popular: false,
      buttonText:
        currentPlan === "annual"
          ? "Plan curent"
          : "Cel mai avantajos",
      active: currentPlan === "annual",
      highlight: "ECONOMISEȘTI 29%",
      sublabel: "420 lei/an",
    },
  ];

  return (
    <div className="space-y-5 pt-2">
      {/* Header */}
      <div className="text-center">
        <h1
          className="text-xl font-bold text-foreground mb-1"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          Alege Planul Tău
        </h1>
        <p className="text-sm text-muted-foreground">
          Deblochează tot potențialul BACsmart
        </p>
      </div>

      {/* Trial Banner */}
      <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/10 rounded-2xl p-4 border border-primary/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="flex items-start gap-3 relative">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm" style={{ fontFamily: "var(--font-syne)" }}>
              🎁 5 zile trial GRATUIT Premium
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Acces complet la toate funcțiile premium, fără obligații. Anulezi oricând.
            </p>
          </div>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="space-y-4">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative bg-card rounded-2xl p-4 border-2 ${
              plan.active
                ? "border-green-500"
                : plan.popular
                ? "border-primary"
                : "border-border"
            }`}
          >
            {/* Badge */}
            {plan.popular && !plan.active && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                CEL MAI POPULAR
              </div>
            )}
            {plan.active && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" /> ACTIV
              </div>
            )}

            {/* Highlight label */}
            {plan.highlight && !plan.active && (
              <div className="mb-3">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  <Star className="w-3 h-3" />
                  {plan.highlight}
                </span>
              </div>
            )}

            {/* Title + Price */}
            <div className="flex items-center justify-between mb-3">
              <h3
                className="font-bold text-lg text-foreground"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                {plan.name}
              </h3>
              <div className="text-right">
                <div className="flex items-baseline gap-1">
                  {plan.originalPrice && !plan.active && (
                    <span className="text-sm text-muted-foreground line-through">
                      {plan.originalPrice}
                    </span>
                  )}
                  <span
                    className="text-2xl font-bold text-foreground"
                    style={{ fontFamily: "var(--font-syne)" }}
                  >
                    {plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {" "}lei{plan.period}
                  </span>
                </div>
                {plan.sublabel && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {plan.sublabel}
                  </p>
                )}
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-2 mb-4">
              {plan.features.map((feature, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Check
                    className={`w-4 h-4 shrink-0 ${
                      plan.active
                        ? "text-green-500"
                        : plan.popular
                        ? "text-primary"
                        : "text-secondary"
                    }`}
                  />
                  {feature}
                </li>
              ))}
            </ul>

            {/* Annual saving note */}
            {plan.id === "annual" && !plan.active && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-400 shrink-0" />
                <p className="text-xs text-green-400">
                  Economisești <strong>168 lei</strong> comparativ cu lunar
                </p>
              </div>
            )}

            {/* Button */}
            <button
              onClick={() => onPlanClick(plan.id)}
              disabled={plan.active}
              className={`w-full py-3 rounded-xl font-medium transition-all ${
                plan.active
                  ? "bg-green-500/20 text-green-500 cursor-not-allowed"
                  : plan.popular
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              {plan.buttonText}
            </button>
          </div>
        ))}
      </div>

      {/* Trust Badge */}
      <div className="text-center text-xs text-muted-foreground">
        <p>Plăți securizate prin Apple Pay / Google Play</p>
        <p className="mt-1">Anulezi oricând, fără obligații</p>
      </div>
    </div>
  );
}
