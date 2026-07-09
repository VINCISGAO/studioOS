import React from "react";

type AuthVerificationEmailProps = {
  preview: string;
  accountLabel: string;
  code: string;
  validMinutes?: number;
};

const body = {
  margin: "0",
  padding: "40px 16px",
  width: "100%",
  backgroundColor: "#f6f8fa",
  fontFamily:
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif,'Apple Color Emoji','Segoe UI Emoji'"
};

const outer = {
  width: "100%",
  maxWidth: "544px",
  margin: "0 auto"
};

const headerText = {
  margin: "0 0 4px",
  color: "#24292f",
  fontSize: "20px",
  lineHeight: "28px",
  fontWeight: "400",
  textAlign: "center" as const
};

const accountName = {
  margin: "0 0 24px",
  color: "#24292f",
  fontSize: "20px",
  lineHeight: "28px",
  fontWeight: "700",
  textAlign: "center" as const
};

const card = {
  margin: "0",
  padding: "32px",
  border: "1px solid #d0d7de",
  borderRadius: "6px",
  backgroundColor: "#ffffff"
};

const cardLead = {
  margin: "0 0 24px",
  color: "#24292f",
  fontSize: "14px",
  lineHeight: "20px"
};

const codeStyle = {
  margin: "0 0 24px",
  color: "#24292f",
  fontSize: "32px",
  lineHeight: "40px",
  fontWeight: "700",
  letterSpacing: "0.04em",
  textAlign: "center" as const
};

const cardBody = {
  margin: "0 0 16px",
  color: "#24292f",
  fontSize: "14px",
  lineHeight: "20px"
};

const signOff = {
  margin: "24px 0 0",
  color: "#24292f",
  fontSize: "14px",
  lineHeight: "20px"
};

const footer = {
  margin: "24px 0 0",
  color: "#656d76",
  fontSize: "12px",
  lineHeight: "18px"
};

const footerRule = {
  border: "0",
  borderTop: "1px solid #d0d7de",
  margin: "16px 0"
};

const footerLink = {
  color: "#0969da",
  textDecoration: "none"
};

export function AuthVerificationEmail({
  preview,
  accountLabel,
  code,
  validMinutes = 5
}: AuthVerificationEmailProps) {
  return (
    <html>
      <head />
      <body style={body}>
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
        <table
          role="presentation"
          cellPadding={0}
          cellSpacing={0}
          border={0}
          width="100%"
          style={outer}
        >
          <tbody>
            <tr>
              <td align="center" style={{ paddingBottom: "8px" }}>
                <img
                  src="https://vincis.app/images/LOGO.png"
                  width="48"
                  height="48"
                  alt="VINCIS"
                  style={{
                    display: "block",
                    margin: "0 auto 16px",
                    border: "0",
                    borderRadius: "8px"
                  }}
                />
                <p style={headerText}>Please verify your identity,</p>
                <p style={accountName}>{accountLabel}</p>
              </td>
            </tr>
            <tr>
              <td>
                <div style={card}>
                  <p style={cardLead}>Here is your VINCIS verification code:</p>
                  <p style={codeStyle}>{code}</p>
                  <p style={cardBody}>
                    This code is valid for <strong>{validMinutes} minutes</strong> and can only be used once.
                  </p>
                  <p style={cardBody}>
                    <strong>Please don&apos;t share this code with anyone:</strong> we&apos;ll never ask for it on the
                    phone or via email.
                  </p>
                  <p style={signOff}>
                    Thanks,
                    <br />
                    The VINCIS Team
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td style={footer}>
                <p style={{ margin: "0 0 12px" }}>
                  You&apos;re receiving this email because a verification code was requested for your VINCIS account.
                  If this wasn&apos;t you, please ignore this email.
                </p>
                <hr style={footerRule} />
                <p style={{ margin: 0 }}>
                  VINCIS •{" "}
                  <a href="https://vincis.app" style={footerLink}>
                    vincis.app
                  </a>
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}
