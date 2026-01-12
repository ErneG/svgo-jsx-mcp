import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface PasswordResetEmailProps {
  resetUrl: string;
  userName?: string;
  expiresInMinutes?: number;
}

export function PasswordResetEmail({
  resetUrl,
  userName,
  expiresInMinutes = 60,
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your SVGO JSX password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Reset Your Password</Heading>

          <Text style={text}>Hi{userName ? ` ${userName}` : ""},</Text>

          <Text style={text}>
            We received a request to reset your password for your SVGO JSX account. Click the button
            below to set a new password:
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={resetUrl}>
              Reset Password
            </Button>
          </Section>

          <Text style={text}>This link will expire in {expiresInMinutes} minutes.</Text>

          <Text style={text}>
            If you did not request this password reset, you can safely ignore this email. Your
            password will remain unchanged.
          </Text>

          <Text style={footer}>
            If the button does not work, copy and paste this URL into your browser:
            <br />
            <Link href={resetUrl} style={link}>
              {resetUrl}
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  padding: "40px 0",
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #e6ebf1",
  borderRadius: "8px",
  margin: "0 auto",
  padding: "40px",
  maxWidth: "560px",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "1.4",
  margin: "0 0 24px",
};

const text = {
  color: "#4a5568",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#6366f1",
  borderRadius: "8px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "600",
  padding: "14px 32px",
  textDecoration: "none",
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "1.6",
  marginTop: "32px",
};

const link = {
  color: "#6366f1",
  wordBreak: "break-all" as const,
};

export default PasswordResetEmail;
