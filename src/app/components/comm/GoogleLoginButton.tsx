"use client";

import { useEffect, useRef } from "react";

const GOOGLE_CLIENT_ID =
  "111515033736-dffaqu4qg36n2ovfhpaa7qgtndd3u4q2.apps.googleusercontent.com";

export default function GoogleLoginButton() {
  const divRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // @ts-ignore
      if (window.google && window.google.accounts && divRef.current) {
        // @ts-ignore
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response: any) => {
            try {
              const res = await fetch("/api/auth/google-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential: response.credential }),
              });
              if (res.ok) {
                location.reload();
              } else {
                console.error("Login failed");
              }
            } catch (e) {
              console.error(e);
            }
          },
        });
        // @ts-ignore
        window.google.accounts.id.renderButton(divRef.current, {
          theme: "outline",
          size: "large",
          type: "standard",
          shape: "rectangular",
          text: "signin_with",
          logo_alignment: "left",
        });
      }
    };
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return <div ref={divRef} />;
}


