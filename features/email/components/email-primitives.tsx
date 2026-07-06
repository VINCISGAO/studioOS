import React, { type ReactNode } from "react";

export type EmailDetail = {
  label: string;
  value?: string | number | null;
};

const card = {
  margin: "26px 0 0",
  padding: "20px",
  border: "1px solid #303030",
  borderRadius: "18px",
  backgroundColor: "#121212"
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
  marginTop: "24px",
  borderRadius: "999px",
  backgroundColor: "#f4f4f4",
  color: "#090909",
  fontSize: "14px",
  lineHeight: "20px",
  fontWeight: "700",
  textDecoration: "none",
  padding: "13px 22px"
};

const codeBlock = {
  margin: "28px 0 0",
  padding: "24px 18px",
  border: "1px solid #555555",
  borderRadius: "16px",
  backgroundColor: "#111111",
  color: "#f8f8f8",
  fontSize: "42px",
  lineHeight: "52px",
  fontWeight: "800",
  letterSpacing: "0.34em",
  textAlign: "center" as const
};

const muted = {
  margin: "14px 0 0",
  color: "#b8b8b8",
  fontSize: "14px",
  lineHeight: "22px",
  textAlign: "center" as const
};

const note = {
  margin: "26px 0 0",
  padding: "18px",
  border: "1px solid #242424",
  borderRadius: "16px",
  backgroundColor: "#101010",
  color: "#d7d7d7",
  fontSize: "14px",
  lineHeight: "23px"
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
