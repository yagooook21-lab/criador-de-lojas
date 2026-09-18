import { useState, useMemo, useCallback } from "react";

import dog1 from "@/assets/captcha/dog1.jpg";
import dog2 from "@/assets/captcha/dog2.jpg";
import dog3 from "@/assets/captcha/dog3.jpg";
import dog4 from "@/assets/captcha/dog4.jpg";
import cat1 from "@/assets/captcha/cat1.jpg";
import car1 from "@/assets/captcha/car1.jpg";
import bike1 from "@/assets/captcha/bike1.jpg";
import flower1 from "@/assets/captcha/flower1.jpg";
import bird1 from "@/assets/captcha/bird1.jpg";

const DOG_IMAGES = [
  { src: dog1, isDog: true },
  { src: dog2, isDog: true },
  { src: dog3, isDog: true },
  { src: dog4, isDog: true },
];

const OTHER_IMAGES = [
  { src: cat1, isDog: false },
  { src: car1, isDog: false },
  { src: bike1, isDog: false },
  { src: flower1, isDog: false },
  { src: bird1, isDog: false },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface CrawlerCaptchaProps {
  onSolved: () => void;
}

const CrawlerCaptcha = ({ onSolved }: CrawlerCaptchaProps) => {
  const [phase, setPhase] = useState<"checkbox" | "images" | "error">("checkbox");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [shaking, setShaking] = useState(false);

  // Pick 3 random dogs + 6 random others = 9 images in a 3x3 grid
  const grid = useMemo(() => {
    const dogs = shuffle(DOG_IMAGES).slice(0, 3);
    const others = shuffle(OTHER_IMAGES).slice(0, 5);
    // We need exactly 9: add one more other duplicate with different key
    const extra = shuffle(OTHER_IMAGES).slice(0, 1);
    return shuffle([...dogs, ...others, ...extra]);
  }, []);

  const correctDogIndices = useMemo(() => {
    const indices = new Set<number>();
    grid.forEach((item, i) => {
      if (item.isDog) indices.add(i);
    });
    return indices;
  }, [grid]);

  const toggleImage = (idx: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleVerify = useCallback(() => {
    // Check if selected matches exactly the dog images
    if (
      selected.size === correctDogIndices.size &&
      [...correctDogIndices].every(i => selected.has(i))
    ) {
      onSolved();
    } else {
      setShaking(true);
      setTimeout(() => {
        setShaking(false);
        setSelected(new Set());
        setPhase("error");
        setTimeout(() => setPhase("images"), 1500);
      }, 500);
    }
  }, [selected, correctDogIndices, onSolved]);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 99999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f5f5f5",
      fontFamily: "'Roboto', 'Helvetica Neue', Arial, sans-serif",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 400,
        background: "#fff",
        borderRadius: 3,
        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
        overflow: "hidden",
      }}>
        {phase === "checkbox" && (
          <div style={{ padding: "24px 20px" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              border: "1px solid #d3d3d3",
              borderRadius: 3,
              padding: "12px 16px",
              background: "#f9f9f9",
              cursor: "pointer",
            }} onClick={() => setPhase("images")}>
              <div style={{
                width: 28,
                height: 28,
                border: "2px solid #c1c1c1",
                borderRadius: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <div style={{ width: 0, height: 0 }} />
              </div>
              <span style={{ fontSize: 14, color: "#202124", fontWeight: 400 }}>
                Não sou um robô
              </span>
              <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <svg width="32" height="32" viewBox="0 0 64 64">
                  <path d="M32 2C15.4 2 2 15.4 2 32s13.4 30 30 30 30-13.4 30-30S48.6 2 32 2z" fill="#4285F4" />
                  <path d="M32 12c-11 0-20 9-20 20s9 20 20 20 20-9 20-20-9-20-20-20z" fill="#fff" />
                  <path d="M32 17c-8.3 0-15 6.7-15 15s6.7 15 15 15 15-6.7 15-15-6.7-15-15-15z" fill="#4285F4" opacity="0.3" />
                  <text x="32" y="38" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#4285F4">✓</text>
                </svg>
                <span style={{ fontSize: 8, color: "#555", letterSpacing: 0.5 }}>reCAPTCHA</span>
              </div>
            </div>
          </div>
        )}

        {(phase === "images" || phase === "error") && (
          <>
            <div style={{
              background: "#4285F4",
              padding: "16px 20px",
              color: "#fff",
            }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                Selecione todas as imagens com
              </div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>
                cachorros
              </div>
              {phase === "error" && (
                <div style={{ fontSize: 12, color: "#ffcdd2", marginTop: 6 }}>
                  Tente novamente. Selecione todas as imagens corretas.
                </div>
              )}
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 2,
              padding: 2,
              background: "#e0e0e0",
              animation: shaking ? "captcha-shake 0.4s ease" : undefined,
            }}>
              {grid.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => toggleImage(idx)}
                  style={{
                    position: "relative",
                    aspectRatio: "1",
                    cursor: "pointer",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={item.src}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      transition: "transform 0.15s ease",
                      transform: selected.has(idx) ? "scale(0.85)" : "scale(1)",
                    }}
                  />
                  {selected.has(idx) && (
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      border: "3px solid #4285F4",
                      background: "rgba(66,133,244,0.15)",
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "flex-end",
                      padding: 4,
                    }}>
                      <div style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: "#4285F4",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12l5 5L20 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              padding: "12px 16px",
              borderTop: "1px solid #e0e0e0",
            }}>
              <button
                onClick={handleVerify}
                disabled={selected.size === 0}
                style={{
                  padding: "10px 24px",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#fff",
                  background: selected.size > 0 ? "#4285F4" : "#a0c4ff",
                  border: "none",
                  borderRadius: 3,
                  cursor: selected.size > 0 ? "pointer" : "not-allowed",
                  transition: "background 0.2s",
                }}
              >
                Verificar
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes captcha-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
};

export default CrawlerCaptcha;
