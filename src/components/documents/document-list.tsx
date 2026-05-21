"use client";

import { useRouter } from "next/navigation";

type VehicleDocument = {
  id: string;
  title: string;
  type: string;
  fileName: string | null;
  fileUrl: string | null;
  description: string | null;
  createdAt: string;
};

type DocumentListProps = {
  documents: VehicleDocument[];
};

const typeLabels: Record<string, string> = {
  receipt: "Чек",
  insurance: "Страховка",
  service_act: "Акт сервиса",
  photo: "Фото",
  pdf: "PDF",
  other: "Другое"
};

function isImage(url: string) {
  return /\.(jpg|jpeg|png|webp)$/i.test(url);
}

export function DocumentList({ documents }: DocumentListProps) {
  const router = useRouter();

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Удалить документ?");

    if (!confirmed) {
      return;
    }

    await fetch(`/api/documents/${id}`, {
      method: "DELETE"
    });

    router.refresh();
  }

  if (documents.length === 0) {
    return (
      <div className="card p-8 text-center">
        <h2 className="text-lg font-semibold">Документов пока нет</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Добавьте фото чека, PDF, страховку или другой документ.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {documents.map((document) => {
        const url = document.fileUrl || "";

        return (
          <article key={document.id} className="card overflow-hidden">
            {url && isImage(url) ? (
              <div className="h-44 border-b border-[var(--border)] bg-[var(--surface-muted)]">
                <img
                  src={url}
                  alt={document.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}

            <div className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs text-[var(--accent-dark)]">
                    {typeLabels[document.type] || document.type}
                  </span>

                  <h2 className="mt-3 text-lg font-semibold">{document.title}</h2>

                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Добавлено: {new Date(document.createdAt).toLocaleDateString("ru-RU")}
                  </p>
                </div>
              </div>

              {document.description ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  {document.description}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary text-sm"
                  >
                    Открыть файл
                  </a>
                ) : null}

                <button
                  type="button"
                  onClick={() => handleDelete(document.id)}
                  className="rounded-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Удалить
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
