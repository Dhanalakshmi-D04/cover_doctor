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
    <div className="upgrade-button-wrap">
      <button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
        {mutation.isPending ? "Redirecting..." : "Upgrade to Paid"}
      </button>
      {mutation.isError && <p className="error small">{mutation.error.message}</p>}
    </div>
  );
}
