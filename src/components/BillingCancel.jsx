import { Link } from "react-router-dom";
import AppLayout from "./AppLayout";

export default function BillingCancel() {
  return (
    <AppLayout>
      <div className="page-container" style={{ paddingTop: "2rem", maxWidth: 560 }}>
        <h1>Checkout canceled</h1>
        <p>No charges were made. You can upgrade anytime from your profile.</p>
        <Link to="/profile" className="btn btn-outline">
          Back to profile
        </Link>
      </div>
    </AppLayout>
  );
}
