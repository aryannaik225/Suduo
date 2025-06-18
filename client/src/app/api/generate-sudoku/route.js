import { makepuzzle, solvepuzzle, ratepuzzle } from "sudoku";

export async function GET(request) {
  const url = new URL(request.url);
  const difficulty = url.searchParams.get("difficulty")?.toLowerCase() || "easy";

  const difficultyMap = {
    easy: 0.2,
    medium: 2.5,
    hard: 4.5,
    insane: 6.5,
    inhuman: 8.0,
  };

  const targetDifficulty = difficultyMap[difficulty];

  if (targetDifficulty === undefined) {
    return new Response(
      JSON.stringify({ error: "Invalid difficulty level" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  let puzzle, solution, rating;
  do {
    puzzle = makepuzzle();
    solution = solvepuzzle(puzzle);
    rating = ratepuzzle(puzzle, 4);
  } while (rating[0] < targetDifficulty);

  return new Response(
    JSON.stringify({
      puzzle: puzzle.map((cell) => (cell === null ? null : cell + 1)),
      solution: solution.map((cell) => (cell === null ? null : cell + 1)),
      difficultyRating: rating[0], // sending back user difficulty label too
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}