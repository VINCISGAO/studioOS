import React, { type ReactNode } from "react";

type EmailLayoutProps = {
  preview: string;
  title: string;
  subtitle: string;
  children: ReactNode;
};

const page = {
  margin: "0",
  width: "100%",
  backgroundColor: "#000000",
  fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif"
};

const container = {
  width: "100%",
  maxWidth: "600px",
  margin: "0 auto",
  padding: "0"
};

const frame = {
  margin: "0 auto",
  border: "1px solid #303030",
  borderRadius: "30px",
  backgroundColor: "#050505",
  overflow: "hidden"
};

const hero = {
  padding: "44px 30px 26px",
  textAlign: "center" as const,
  backgroundColor: "#050505"
};

const logoMark = {
  margin: "0 auto 24px",
  width: "84px",
  height: "84px",
  borderRadius: "22px",
  display: "block",
  border: "1px solid #565656",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 18px 44px rgba(0,0,0,0.45)"
};

const brand = {
  margin: "0",
  color: "#f3f3f3",
  fontSize: "25px",
  lineHeight: "34px",
  letterSpacing: "0.46em",
  fontWeight: "600"
};

const titleStyle = {
  margin: "38px 0 14px",
  color: "#ffffff",
  fontSize: "34px",
  lineHeight: "42px",
  fontWeight: "700",
  letterSpacing: "-0.04em"
};

const subtitleStyle = {
  margin: "0 auto",
  maxWidth: "390px",
  color: "#cfcfcf",
  fontSize: "16px",
  lineHeight: "27px"
};

const content = {
  padding: "12px 30px 34px",
  backgroundColor: "#050505"
};

const footer = {
  padding: "26px 28px 32px",
  textAlign: "center" as const
};

const footerBrand = {
  margin: "0 0 6px",
  color: "#e8e8e8",
  fontSize: "16px",
  lineHeight: "22px",
  letterSpacing: "0.48em",
  fontWeight: "600"
};

const footerText = {
  margin: "0",
  color: "#8f8f8f",
  fontSize: "13px",
  lineHeight: "21px"
};

const divider = {
  borderColor: "#2d2d2d",
  margin: "0"
};

const accentDivider = {
  margin: "32px auto 0",
  width: "78%",
  height: "1px",
  backgroundColor: "#2d2d2d"
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
              <img
                src="https://vincis.app/images/LOGO.png"
                width="84"
                height="84"
                alt="VINCIS"
                style={logoMark}
              />
              <p style={brand}>VINCIS</p>
              <h1 style={titleStyle}>
                {title}
              </h1>
              <p style={subtitleStyle}>{subtitle}</p>
              <div style={accentDivider} />
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
