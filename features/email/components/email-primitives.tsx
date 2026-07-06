import React, { type ReactNode } from "react";

export type EmailDetail = {
  label: string;
  value?: string | number | null;
};

const card = {
  margin: "28px 0 0",
  padding: "22px",
  border: "1px solid #343434",
  borderRadius: "22px",
  backgroundColor: "#0f0f0f",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)"
};

const label = {
  margin: "0",
  color: "#8e8e8e",
  fontSize: "12px",
  lineHeight: "18px",
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  fontWeight: "600"
};

const value = {
  margin: "4px 0 0",
  color: "#f4f4f4",
  fontSize: "15px",
  lineHeight: "24px",
  fontWeight: "600"
};

const detailDivider = {
  borderColor: "#282828",
  margin: "14px 0"
};

const button = {
  display: "inline-block",
  marginTop: "28px",
  borderRadius: "999px",
  backgroundColor: "#f2f2f2",
  color: "#090909",
  fontSize: "14px",
  lineHeight: "20px",
  fontWeight: "700",
  textDecoration: "none",
  padding: "13px 22px"
};

const codeBlock = {
  margin: "16px 0 0",
  padding: "28px 18px",
  border: "1px solid #4f4f4f",
  borderRadius: "20px",
  backgroundColor: "#0b0b0b",
  color: "#ffffff",
  fontSize: "46px",
  lineHeight: "56px",
  fontWeight: "800",
  letterSpacing: "0.32em",
  textAlign: "center" as const,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), 0 18px 42px rgba(0,0,0,0.36)"
};

const muted = {
  margin: "18px 0 0",
  color: "#bdbdbd",
  fontSize: "14px",
  lineHeight: "22px",
  textAlign: "center" as const
};

const note = {
  margin: "28px 0 0",
  padding: "20px 22px",
  border: "1px solid #262626",
  borderRadius: "18px",
  backgroundColor: "#0c0c0c",
  color: "#dcdcdc",
  fontSize: "14px",
  lineHeight: "24px",
  textAlign: "center" as const
};

const paragraph = {
  margin: "18px 0 0",
  color: "#d4d4d4",
  fontSize: "15px",
  lineHeight: "25px"
};

export function EmailParagraph({ children }: { children: ReactNode }) {
  return <p style={paragraph}>{children}</p>;
}

export function EmailButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} style={button}>
      {children}
    </a>
  );
}

export function EmailCodeBlock({
  code,
  expiryLabel
}: {
  code: string;
  expiryLabel: string;
}) {
  return (
    <>
      <p style={codeBlock}>{code}</p>
      <p style={muted}>{expiryLabel}</p>
    </>
  );
}

export function EmailSecurityNote({ children }: { children: ReactNode }) {
  return <p style={note}>{children}</p>;
}

export function EmailDetailCard({
  details,
  children
}: {
  details: EmailDetail[];
  children?: ReactNode;
}) {
  const visibleDetails = details.filter(
    (detail) => detail.value !== undefined && detail.value !== null && String(detail.value).trim() !== ""
  );

  return (
    <div style={card}>
      {visibleDetails.map((detail, index) => (
        <div key={detail.label}>
          {index > 0 ? <hr style={detailDivider} /> : null}
          <p style={label}>{detail.label}</p>
          <p style={value}>{detail.value}</p>
        </div>
      ))}
      {children}
    </div>
  );
}
