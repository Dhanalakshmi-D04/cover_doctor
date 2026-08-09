import { useMutation } from "@tanstack/react-query";
import { startCheckout } from "../api/client";

export default function UpgradeButton({ plan = "monthly" }) {
  const mutation = useMutation({
    mutationFn: () => startCheckout(plan),
    onSuccess: (data) => {
      window.location.href = data.checkout_url;
    },
  });

  return (
    <div>
      <button
        className="btn-amber"
        style={{ padding: "0.5rem 1.1rem", fontSize: "0.85rem" }}
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? "Redirecting..." : "⭐ Upgrade Pro"}
      </button>
      {mutation.isError && (
        <p style={{ color: "var(--theme-russet)", fontSize: "0.75rem", marginTop: "2px" }}>
          {mutation.error.message}
        </p>
      )}
    </div>
  );
}
