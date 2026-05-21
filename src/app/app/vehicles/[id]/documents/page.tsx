import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocumentForm } from "@/components/documents/document-form";
import { DocumentList } from "@/components/documents/document-list";

type DocumentsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function VehicleDocumentsPage({ params }: DocumentsPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { id } = await params;

  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id,
      OR: [
        { ownerId: user.id },
        {
          owner: {
            ownerTeamMembers: {
              some: {
                memberId: user.id
              }
            }
          }
        }
      ]
    },
    include: {
      documents: {
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  });

  if (!vehicle) {
    notFound();
  }

  const documents = vehicle.documents.map((document) => ({
    id: document.id,
    title: document.title,
    type: document.type,
    fileName: document.fileName,
    fileUrl: document.fileUrl,
    description: document.description,
    createdAt: document.createdAt.toISOString()
  }));

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-medium text-[var(--accent-dark)]">
            Документы
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {vehicle.make} {vehicle.model}
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Чеки, фото, PDF, страховки и сервисные документы. Всего: {documents.length}
          </p>
        </div>

        <Link href={`/app/vehicles/${vehicle.id}`} className="btn-secondary">
          Назад к автомобилю
        </Link>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <DocumentForm vehicleId={vehicle.id} />
        <DocumentList documents={documents} />
      </section>
    </div>
  );
}
