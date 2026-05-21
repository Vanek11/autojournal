"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DocumentFormProps = {
  vehicleId: string;
};

const documentTypes = [
  { value: "receipt", label: "Чек" },
  { value: "insurance", label: "Страховка" },
  { value: "service_act", label: "Акт сервиса" },
  { value: "photo", label: "Фото" },
  { value: "pdf", label: "PDF" },
  { value: "other", label: "Другое" }
];

export function DocumentForm({ vehicleId }: DocumentFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [type, setType] = useState("receipt");
  const [fileUrl, setFileUrl] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const formData = new FormData();

    formData.append("vehicleId", vehicleId);
    formData.append("title", title);
    formData.append("type", type);
    formData.append("fileUrl", fileUrl);
    formData.append("description", description);

    if (file) {
      formData.append("file", file);
    }

    const response = await fetch("/api/documents", {
      method: "POST",
      body: formData
    });

    const result = await response.json();

    setLoading(false);

    if (!response.ok) {
      setError(result.error || "Не удалось добавить документ");
      return;
    }

    setTitle("");
    setType("receipt");
    setFileUrl("");
    setDescription("");
    setFile(null);

    const input = document.getElementById("document-file") as HTMLInputElement | null;

    if (input) {
      input.value = "";
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card-large space-y-5 p-6">
      <div>
        <h2 className="text-xl font-semibold">Новый документ</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Загрузите фото, PDF чека или укажите ссылку на документ.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>Название</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="input"
            placeholder="Например: чек за замену масла"
            required
          />
        </label>

        <label className="space-y-1 text-sm">
          <span>Тип документа</span>
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="input"
          >
            {documentTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span>Файл JPG, PNG, WEBP или PDF</span>
        <input
          id="document-file"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
          className="input"
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span>Или ссылка на файл</span>
        <input
          value={fileUrl}
          onChange={(event) => setFileUrl(event.target.value)}
          className="input"
          placeholder="https://example.com/receipt.pdf"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span>Комментарий</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="input min-h-24"
          placeholder="Дополнительные детали"
        />
      </label>

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? "Добавление..." : "Добавить документ"}
      </button>
    </form>
  );
}
