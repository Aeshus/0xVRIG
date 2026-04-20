import { getAllExercises } from '@/exercises/registry';
import ExercisePageClient from './ExercisePageClient';

export function generateStaticParams() {
  return getAllExercises().map((ex) => ({ id: ex.id }));
}

export default function ExercisePage({ params }: { params: Promise<{ id: string }> }) {
  return <ExercisePageClient params={params} />;
}
