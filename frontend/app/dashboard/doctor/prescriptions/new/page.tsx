"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import PrescriptionForm from "@/components/PrescriptionForm"

export default function NewPrescription() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(true);

  const handleClose = () => {
    setShowForm(false);
    router.push("/dashboard/doctor");
  };

  const handleSaved = () => {
    setShowForm(false);
    router.push("/dashboard/doctor");
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      {showForm && (
        <PrescriptionForm
          onClose={handleClose}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
} 