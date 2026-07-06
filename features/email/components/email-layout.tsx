import React, { type ReactNode } from "react";

type EmailLayoutProps = {
  preview: string;
  title: string;
  subtitle: string;
  children: ReactNode;
};

const page = {
  margin: "0",
  backgroundColor: "#050505",
  fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif"
};

const container = {
  width: "100%",
  maxWidth: "640px",
  margin: "0 auto",
  padding: "32px 16px"
};

const frame = {
  border: "1px solid #2a2a2a",
  borderRadius: "24px",
  backgroundColor: "#090909",
  overflow: "hidden"
};

const hero = {
  padding: "38px 28px 28px",
  textAlign: "center" as const,
  backgroundColor: "#070707"
};

const logoMark = {
  margin: "0 auto 18px",
  width: "72px",
  height: "72px",
  borderRadius: "24px",
  border: "1px solid #777777",
  backgroundColor: "#111111",
  color: "#f5f5f5",
  fontSize: "28px",
  lineHeight: "72px",
  fontWeight: "700",
  letterSpacing: "-0.12em",
  textAlign: "center" as const
};

const brand = {
  margin: "0",
  color: "#eeeeee",
  fontSize: "24px",
  lineHeight: "32px",
  letterSpacing: "0.42em",
  fontWeight: "600"
};

const titleStyle = {
  margin: "30px 0 12px",
  color: "#ffffff",
  fontSize: "32px",
  lineHeight: "40px",
  fontWeight: "700",
  letterSpacing: "-0.03em"
};

const subtitleStyle = {
  margin: "0",
  color: "#c8c8c8",
  fontSize: "16px",
  lineHeight: "26px"
};

const content = {
  padding: "0 28px 30px"
};

const footer = {
  padding: "24px 28px 30px",
  textAlign: "center" as const
};

const footerBrand = {
  margin: "0 0 6px",
  color: "#e8e8e8",
  fontSize: "15px",
  lineHeight: "22px",
  letterSpacing: "0.42em",
  fontWeight: "600"
};

const footerText = {
  margin: "0",
  color: "#8f8f8f",
  fontSize: "13px",
  lineHeight: "21px"
};

const divider = {
  borderColor: "#242424",
  margin: "0"
};

export function EmailLayout({ preview, title, subtitle, children }: EmailLayoutProps) {
  return (
    <html>
      <head />
      <body style={page}>
        <div
          style={{
            display: "none",
            maxHeight: 0,
            overflow: "hidden",
            opacity: 0,
            color: "transparent"
          }}
        >
          {preview}
        </div>
        <div style={container}>
          <div style={frame}>
            <div style={hero}>
              <p style={logoMark}>V</p>
              <p style={brand}>VINCIS</p>
              <h1 style={titleStyle}>
                {title}
              </h1>
              <p style={subtitleStyle}>{subtitle}</p>
            </div>
            <div style={content}>{children}</div>
            <hr style={divider} />
            <div style={footer}>
              <p style={footerBrand}>VINCIS</p>
              <p style={footerText}>AI Creator Platform</p>
              <p style={footerText}>vincis.app</p>
              <p style={footerText}>© 2026 VINCIS. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
