import { FormEvent, useEffect, useState } from "react";

interface Todo {
  id: number;
  title: string;
  done: boolean;
}

export function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/todos")
      .then((res) => res.json())
      .then((data) => setTodos(data.data))
      .catch(() => setError("Failed to load todos"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;

    const response = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });

    const data = await response.json();
    if (response.ok) {
      setTodos((current) => [...current, data]);
      setTitle("");
    } else {
      setError(data.error ?? "Failed to create todo");
    }
  }

  if (loading) return <p className="status">Loading todos from mock API...</p>;
  if (error) return <p className="status error">{error}</p>;

  return (
    <main className="container">
      <h1>Todo App</h1>
      <p className="subtitle">Powered by mockify-cli</p>

      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <span>{todo.done ? "✅" : "⬜"}</span> {todo.title}
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New todo"
        />
        <button type="submit">Add</button>
      </form>
    </main>
  );
}
