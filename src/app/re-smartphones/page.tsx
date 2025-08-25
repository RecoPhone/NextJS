import { fetchUtopya } from "@/lib/utopya";
import UtopyaBrowser from "./components/UtopyaBrowser";

export const revalidate = 600;

export default async function SmartphonesPage() {
  const data = await fetchUtopya();

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold text-[#222]">
          Smartphones reconditionnés <span className="text-[#54b435]">disponibles</span>
        </h1>
        <p className="text-gray-600 mt-2">
          Donnez une seconde vie à un appareil — écologique et économique 🌱
        </p>
      </header>

      <UtopyaBrowser initialItems={data.items} />
    </main>
  );
}
