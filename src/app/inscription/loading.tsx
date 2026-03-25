import { SectionLoading } from "@/components/ui/SectionLoading";

export default function InscriptionLoading() {
  return (
    <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center">
      <SectionLoading variant="form" className="max-w-4xl" />
    </div>
  );
}
