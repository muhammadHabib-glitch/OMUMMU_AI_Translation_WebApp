export function isPremiumUser(userOrEntitlements) {
  if (!userOrEntitlements) return false;
  if (typeof userOrEntitlements.isPremium === "boolean") {
    return userOrEntitlements.isPremium;
  }
  return String(userOrEntitlements.plan || userOrEntitlements.userPlan || "Free")
    .toLowerCase()
    .includes("premium");
}

export function formatMoney(amountCents, currency = "usd") {
  if (amountCents == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency || "usd").toUpperCase(),
  }).format(amountCents / 100);
}
