import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function OAuthConsent() {
  return (
    <AuthLayout
      icon={ShieldCheck}
      title="Local authentication build"
      subtitle="This self-hosted version does not use the Base44 consent flow."
      footer={
        <Link to="/" className="text-primary font-medium hover:underline">
          Return to the dashboard
        </Link>
      }
    >
      <p className="text-sm text-foreground/80">
        OAuth consent is handled outside this app in the self-hosted build. Use the standard login flow to access the dashboard.
      </p>
      <div className="mt-6">
        <Button asChild className="w-full h-12 font-medium">
          <Link to="/login">Go to login</Link>
        </Button>
      </div>
    </AuthLayout>
  );
}
