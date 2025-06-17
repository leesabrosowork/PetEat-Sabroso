import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface EMRData {
  petId: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  sex: string;
  owner: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  vaccinations: any[];
  medicalHistory: any[];
  visitHistory: any[];
}

export default function VetEMRForm({
  petId,
  onClose,
  onSaved,
  initialData,
  isAddEMR = false
}: {
  petId: string;
  onClose: () => void;
  onSaved: () => void;
  initialData?: EMRData | null;
  isAddEMR?: boolean;
}) {
  // Default blank form for Add EMR
  const blankForm: EMRData = {
    petId,
    name: '',
    species: '',
    breed: '',
    age: 0,
    sex: 'male',
    owner: {
      name: '',
      phone: '',
      email: '',
      address: ''
    },
    vaccinations: [],
    medicalHistory: [],
    visitHistory: []
  };
  const [form, setForm] = useState<EMRData | null>(isAddEMR ? blankForm : (initialData || null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
  if (isAddEMR) {
    setForm(blankForm);
    setLoading(false);
    setError(null);
    return;
  }
  if (!initialData) {
    setLoading(true);
    setError(null);
    fetch(`http://localhost:8080/api/medical-records/${petId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(res => {
        if (res.ok) return res.json();
        if (res.status === 404) throw new Error("No EMR found for this pet.");
        throw new Error("Failed to fetch EMR.");
      })
      .then(data => setForm(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }
}, [petId, initialData, isAddEMR]);

  const handleChange = (field: string, value: any) => {
    setForm(f => f ? { ...f, [field]: value } : f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const method = isAddEMR ? "POST" : "PUT";
      const url = method === "PUT"
        ? `http://localhost:8080/api/medical-records/${petId}`
        : "http://localhost:8080/api/medical-records";
      // Map vaccinations to backend schema
      const formToSend = {
        ...form,
        vaccinations: (form.vaccinations || []).map(v => ({
          name: v.name,
          dateAdministered: v.dateAdministered,
          nextDueDate: v.nextDueDate,
          veterinarian: v.veterinarian
        }))
      };
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formToSend),
      });
      if (!res.ok) throw new Error("Failed to save EMR");
      setSuccess("EMR saved successfully");
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message || "Failed to save EMR");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4">Loading EMR form...</div>;
if (error && !isAddEMR) return <div className="p-4 text-red-500">{error}</div>;
if (!form) return null;

  return (
    <form onSubmit={handleSubmit} className="p-4 max-w-2xl mx-auto bg-white rounded shadow space-y-4 relative">
      <button
        type="button"
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl font-bold"
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>
      <h2 className="text-xl font-bold mb-2">{form.petId ? "Edit" : "Add"} Medical Record</h2>
      {error && <div className="text-red-500">{error}</div>}
      {success && <div className="text-green-500">{success}</div>}
      <div>
        <label className="block font-medium">Pet Name</label>
        <input className="border rounded p-2 w-full" value={form.name} onChange={e => handleChange("name", e.target.value)} required />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block font-medium">Species</label>
          <input className="border rounded p-2 w-full" value={form.species} onChange={e => handleChange("species", e.target.value)} required />
        </div>
        <div className="flex-1">
          <label className="block font-medium">Breed</label>
          <input className="border rounded p-2 w-full" value={form.breed} onChange={e => handleChange("breed", e.target.value)} required />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block font-medium">Age</label>
          <input type="number" className="border rounded p-2 w-full" value={form.age} onChange={e => handleChange("age", parseInt(e.target.value))} required />
        </div>
        <div className="flex-1">
          <label className="block font-medium">Sex</label>
          <select className="border rounded p-2 w-full" value={form.sex} onChange={e => handleChange("sex", e.target.value)} required>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block font-medium">Owner Name</label>
        <input className="border rounded p-2 w-full" value={form.owner.name} onChange={e => setForm(f => f ? { ...f, owner: { ...f.owner, name: e.target.value } } : f)} required />
      </div>
      <div>
        <label className="block font-medium">Owner Phone</label>
        <input className="border rounded p-2 w-full" value={form.owner.phone} onChange={e => setForm(f => f ? { ...f, owner: { ...f.owner, phone: e.target.value } } : f)} required />
      </div>
      <div>
        <label className="block font-medium">Owner Email</label>
        <input className="border rounded p-2 w-full" value={form.owner.email} onChange={e => setForm(f => f ? { ...f, owner: { ...f.owner, email: e.target.value } } : f)} required />
      </div>
      <div>
        <label className="block font-medium">Owner Address</label>
        <input className="border rounded p-2 w-full" value={form.owner.address} onChange={e => setForm(f => f ? { ...f, owner: { ...f.owner, address: e.target.value } } : f)} required />
      </div>
      {/* Vaccinations Array UI */}
      <div>
        <label className="block font-semibold mb-1">Vaccinations</label>
        {(form.vaccinations || []).map((v, idx) => (
          <div key={idx} className="flex gap-2 mb-1 items-center">
            <input
              className="border rounded p-1 flex-1"
              placeholder="Vaccine Name"
              value={v.name || ''}
              onChange={e => setForm(f => {
                if (!f) return f;
                const arr = [...f.vaccinations];
                arr[idx] = { ...arr[idx], name: e.target.value };
                return { ...f, vaccinations: arr };
              })}
            />
            <input
              className="border rounded p-1 flex-1"
              placeholder="Date Administered"
              type="date"
              value={v.dateAdministered || ''}
              onChange={e => setForm(f => {
                if (!f) return f;
                const arr = [...f.vaccinations];
                arr[idx] = { ...arr[idx], dateAdministered: e.target.value };
                return { ...f, vaccinations: arr };
              })}
            />
            <input
              className="border rounded p-1 flex-1"
              placeholder="Next Due Date"
              type="date"
              value={v.nextDueDate || ''}
              onChange={e => setForm(f => {
                if (!f) return f;
                const arr = [...f.vaccinations];
                arr[idx] = { ...arr[idx], nextDueDate: e.target.value };
                return { ...f, vaccinations: arr };
              })}
            />
            <input
              className="border rounded p-1 flex-1"
              placeholder="Veterinarian"
              value={v.veterinarian || ''}
              onChange={e => setForm(f => {
                if (!f) return f;
                const arr = [...f.vaccinations];
                arr[idx] = { ...arr[idx], veterinarian: e.target.value };
                return { ...f, vaccinations: arr };
              })}
            />
            <Button type="button" size="sm" variant="destructive" onClick={() => setForm(f => {
              if (!f) return f;
              const arr = f.vaccinations.filter((_, i) => i !== idx);
              return { ...f, vaccinations: arr };
            })}>Remove</Button>
          </div>
        ))}
        <Button type="button" size="sm" variant="outline" onClick={() => setForm(f => {
          if (!f) return f;
          return { ...f, vaccinations: [...(f.vaccinations || []), { name: '', dateAdministered: '', nextDueDate: '', veterinarian: '' }] };
        })}>Add Vaccination</Button>
      </div>

      {/* Medical History Array UI */}
      <div>
        <label className="block font-semibold mb-1 mt-4">Medical History</label>
        {(form.medicalHistory || []).map((m, idx) => (
          <div key={idx} className="flex gap-2 mb-1 items-center">
            <input
              className="border rounded p-1 flex-1"
              placeholder="Condition"
              value={m.condition || ''}
              onChange={e => setForm(f => {
                if (!f) return f;
                const arr = [...f.medicalHistory];
                arr[idx] = { ...arr[idx], condition: e.target.value };
                return { ...f, medicalHistory: arr };
              })}
            />
            <input
              className="border rounded p-1 flex-1"
              placeholder="Status"
              value={m.status || ''}
              onChange={e => setForm(f => {
                if (!f) return f;
                const arr = [...f.medicalHistory];
                arr[idx] = { ...arr[idx], status: e.target.value };
                return { ...f, medicalHistory: arr };
              })}
            />
            <input
              className="border rounded p-1 flex-1"
              placeholder="Diagnosis Date"
              type="date"
              value={m.diagnosisDate || ''}
              onChange={e => setForm(f => {
                if (!f) return f;
                const arr = [...f.medicalHistory];
                arr[idx] = { ...arr[idx], diagnosisDate: e.target.value };
                return { ...f, medicalHistory: arr };
              })}
            />
            <input
              className="border rounded p-1 flex-1"
              placeholder="Treatment"
              value={m.treatment || ''}
              onChange={e => setForm(f => {
                if (!f) return f;
                const arr = [...f.medicalHistory];
                arr[idx] = { ...arr[idx], treatment: e.target.value };
                return { ...f, medicalHistory: arr };
              })}
            />
            <Button type="button" size="sm" variant="destructive" onClick={() => setForm(f => {
              if (!f) return f;
              const arr = f.medicalHistory.filter((_, i) => i !== idx);
              return { ...f, medicalHistory: arr };
            })}>Remove</Button>
          </div>
        ))}
        <Button type="button" size="sm" variant="outline" onClick={() => setForm(f => {
          if (!f) return f;
          return { ...f, medicalHistory: [...(f.medicalHistory || []), { condition: '', status: '', diagnosisDate: '', treatment: '' }] };
        })}>Add Medical History</Button>
      </div>

      {/* Visit History Array UI */}
      <div>
        <label className="block font-semibold mb-1 mt-4">Visit History</label>
        {(form.visitHistory || []).map((v, idx) => (
          <div key={idx} className="flex gap-2 mb-1 items-center">
            <input
              className="border rounded p-1 flex-1"
              placeholder="Date"
              type="date"
              value={v.date || ''}
              onChange={e => setForm(f => {
                if (!f) return f;
                const arr = [...f.visitHistory];
                arr[idx] = { ...arr[idx], date: e.target.value };
                return { ...f, visitHistory: arr };
              })}
            />
            <input
              className="border rounded p-1 flex-1"
              placeholder="Reason"
              value={v.reason || ''}
              onChange={e => setForm(f => {
                if (!f) return f;
                const arr = [...f.visitHistory];
                arr[idx] = { ...arr[idx], reason: e.target.value };
                return { ...f, visitHistory: arr };
              })}
            />
            <input
              className="border rounded p-1 flex-1"
              placeholder="Veterinarian"
              value={v.veterinarian || ''}
              onChange={e => setForm(f => {
                if (!f) return f;
                const arr = [...f.visitHistory];
                arr[idx] = { ...arr[idx], veterinarian: e.target.value };
                return { ...f, visitHistory: arr };
              })}
            />
            <input
              className="border rounded p-1 flex-1"
              placeholder="Notes"
              value={v.notes || ''}
              onChange={e => setForm(f => {
                if (!f) return f;
                const arr = [...f.visitHistory];
                arr[idx] = { ...arr[idx], notes: e.target.value };
                return { ...f, visitHistory: arr };
              })}
            />
            <Button type="button" size="sm" variant="destructive" onClick={() => setForm(f => {
              if (!f) return f;
              const arr = f.visitHistory.filter((_, i) => i !== idx);
              return { ...f, visitHistory: arr };
            })}>Remove</Button>
          </div>
        ))}
        <Button type="button" size="sm" variant="outline" onClick={() => setForm(f => {
          if (!f) return f;
          return { ...f, visitHistory: [...(f.visitHistory || []), { date: '', reason: '', veterinarian: '', notes: '' }] };
        })}>Add Visit</Button>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading} className="flex-1">Save</Button>
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
      </div>
    </form>
  );
}
