"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Pet {
  _id: string;
  name: string;
  owner: {
    _id: string;
    username?: string;
    name?: string;
  };
}

interface Medicine {
  _id: string;
  name: string;
  item: string;
}

interface PrescriptionFormProps {
  onClose: () => void;
  onSaved: () => void;
}

export default function PrescriptionForm({ onClose, onSaved }: PrescriptionFormProps) {
  const searchParams = useSearchParams();
  const petIdFromUrl = searchParams.get("petId");
  
  const [pets, setPets] = useState<Pet[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    petId: petIdFromUrl || "",
    medicineId: "",
    description: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No authentication token found");
          return;
        }

        console.log("Fetching pets...");
        // Fetch pets
        const petsRes = await fetch("http://localhost:8080/api/doctors/patients", {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Pets response status:", petsRes.status);
        if (!petsRes.ok) {
          const errorText = await petsRes.text();
          console.error("Pets response error:", errorText);
          throw new Error("Failed to fetch pets");
        }
        const petsData = await petsRes.json();
        console.log("Pets data:", petsData);
        setPets(petsData.data || []);

        console.log("Fetching medicines...");
        // Fetch medicines
        const medicinesRes = await fetch("http://localhost:8080/api/inventory", {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Medicines response status:", medicinesRes.status);
        if (!medicinesRes.ok) {
          const errorText = await medicinesRes.text();
          console.error("Medicines response error:", errorText);
          throw new Error("Failed to fetch medicines");
        }
        const medicinesData = await medicinesRes.json();
        console.log("Medicines data:", medicinesData);
        setMedicines(medicinesData.data || []);
      } catch (err: any) {
        console.error("Error in fetchData:", err);
        setError(err.message);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const res = await fetch("http://localhost:8080/api/prescriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create prescription");
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getOwnerName = (pet: Pet) => {
    if (pet.owner) {
      return pet.owner.username || pet.owner.name || "Unknown Owner";
    }
    return "Unknown Owner";
  };

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
      <h2 className="text-xl font-bold mb-2">New Prescription</h2>
      {error && <div className="text-red-500">{error}</div>}

      <div className="space-y-4">
        <div>
          <Label htmlFor="pet">Pet</Label>
          <Select
            value={formData.petId}
            onValueChange={(value) => setFormData({ ...formData, petId: value })}
            disabled={!!petIdFromUrl || pets.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={pets.length === 0 ? "No pets available" : "Select a pet"} />
            </SelectTrigger>
            <SelectContent>
              {pets.length === 0 ? (
                <div className="px-2 py-1 text-gray-500 select-none">No pets found</div>
              ) : (
                pets.map((pet) => (
                  <SelectItem key={pet._id} value={pet._id}>
                    {pet.name} (Owner: {getOwnerName(pet)})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="medicine">Medicine</Label>
          <Select
            value={formData.medicineId}
            onValueChange={(value) => setFormData({ ...formData, medicineId: value })}
            disabled={medicines.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={medicines.length === 0 ? "No medicines available" : "Select a medicine"} />
            </SelectTrigger>
            <SelectContent>
              {medicines.length === 0 ? (
                <div className="px-2 py-1 text-gray-500 select-none">No medicines found</div>
              ) : (
                medicines.map((medicine) => (
                  <SelectItem key={medicine._id} value={medicine._id}>
                    {medicine.item}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter prescription details..."
            required
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Saving..." : "Save Prescription"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
} 