"use client";
import { useState, useRef } from "react";

export default function Page() {
	const [ings, setIngs] = useState("");
	const [prefs, setPrefs] = useState("");
	const [busy, setBusy] = useState(false);
	const [messages, setMessages] = useState([
		<div
			key="hello"
			className="self-start max-w-md rounded-2xl bg-yellow-400 text-slate-900 px-3 py-2 text-sm">
			Tell me your ingredients and preferences, I’ll suggest recipes!
		</div>,
	]);

	const chatRef = useRef(null);

	function scrollDown() {
		requestAnimationFrame(() => {
			if (chatRef.current) {
				chatRef.current.scrollTo({
					top: chatRef.current.scrollHeight,
					behavior: "smooth",
				});
			}
		});
	}

	function add(el) {
		setMessages((m) => [...m, el]);
		scrollDown();
	}

	// Join arrays like: "a and b" / "a, b, and c"
	function prettyJoin(list) {
		if (!list || !list.length) return "";
		if (list.length === 1) return list[0];
		if (list.length === 2) return `${list[0]} and ${list[1]}`;
		return `${list.slice(0, -1).join(", ")}, and ${list[list.length - 1]}`;
	}

	// Recipe bubble (neat card in dark mode)
	function RecipeBubble({ r }) {
		const title = r.title || "Untitled Recipe";
		const mins = r.time_minutes ? `${r.time_minutes} min` : "—";

		return (
			<div className="self-start max-w-[780px] w-full">
				<div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 shadow-sm">
					<div className="flex items-baseline justify-between gap-3">
						<div className="font-semibold text-slate-100">🍲 {title}</div>
						<div className="text-sm text-slate-300">⏱ {mins}</div>
					</div>

					{r.uses?.length ? (
						<div className="mt-2 grid grid-cols-[88px_1fr] gap-3">
							<div className="text-sm font-semibold text-slate-400">Uses:</div>
							<div className="text-sm text-slate-200 capitalize">
								{prettyJoin(r.uses)}
							</div>
						</div>
					) : null}

					{r.missing?.length ? (
						<div className="mt-1 grid grid-cols-[88px_1fr] gap-3">
							<div className="text-sm font-semibold text-slate-400">
								Missing -
							</div>
							<div className="text-sm capitalize text-slate-200">
								{prettyJoin(r.missing)}
							</div>
						</div>
					) : null}

					{r.steps?.length ? (
						<div className="mt-3">
							<div className="text-sm font-semibold text-slate-300">Steps</div>
							<div className="mt-1 space-y-1.5">
								{r.steps.map((s, i) => (
									<div
										key={i}
										className="flex gap-2 text-[15px] leading-relaxed text-slate-100">
										<span className="text-slate-400">-</span>
										<span className="flex-1">{s}</span>
									</div>
								))}
							</div>
						</div>
					) : null}
				</div>
			</div>
		);
	}

	async function onSubmit(e) {
		e.preventDefault();
		if (!ings.trim()) return;

		add(
			<div
				key={`u-${Date.now()}`}
				className="self-end max-w-[780px] rounded-2xl bg-blue-600 text-white px-3 py-2 text-sm">
				🐶 {ings}
				{prefs ? ` (${prefs})` : ""}
			</div>
		);

		const thinkingKey = `t-${Date.now()}`;
		add(
			<div
				key={thinkingKey}
				className="self-start rounded-2xl bg-yellow-400 text-slate-900 px-3 py-2 text-sm">
				Dobby is thinking… 🐾
			</div>
		);
		setBusy(true);

		try {
			const resp = await fetch("/api/recipes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ingredients: ings, preferences: prefs }),
			});
			const data = await resp.json();

			// remove thinking bubble
			setMessages((m) => m.filter((el) => el.key !== thinkingKey));

			if (!resp.ok) {
				add(
					<div className="self-start rounded-2xl bg-yellow-400 text-slate-900 px-3 py-2 text-sm">
						⚠️ Oops: {data?.error || "Something went wrong"}
					</div>
				);
				return;
			}

			if (!Array.isArray(data.recipes) || data.recipes.length === 0) {
				add(
					<div className="self-start rounded-2xl bg-yellow-400 text-slate-900 px-3 py-2 text-sm">
						😕 I couldn’t find anything tasty. Try more ingredients!
					</div>
				);
				return;
			}

			data.recipes.forEach((r, i) => {
				add(<RecipeBubble key={`r-${Date.now()}-${i}`} r={r} />);
			});

			if (Array.isArray(data.shopping_list) && data.shopping_list.length) {
				add(
					<div className="self-start max-w-[780px] w-full">
						<div className="rounded-xl border border-slate-700 bg-slate-900/80 p-4 shadow-sm">
							<div className="font-semibold text-slate-100">
								🛒 Shopping List
							</div>
							<ul className="ml-5 mt-2 list-disc space-y-1 text-slate-200">
								{data.shopping_list.map((item, i) => (
									<li key={i}>{item}</li>
								))}
							</ul>
						</div>
					</div>
				);
			}
		} catch (err) {
			setMessages((m) => m.filter((el) => el.key !== thinkingKey));
			add(
				<div className="self-start rounded-2xl bg-yellow-400 text-slate-900 px-3 py-2 text-sm">
					⚠️ Error: {err.message}
				</div>
			);
		} finally {
			setBusy(false);
			setIngs("");
			setPrefs("");
			scrollDown();
		}
	}

	return (
		<div className="min-h-screen w-full bg-slate-950 text-slate-100">
			<main className="mx-auto my-8 w-[92vw] max-w-[1100px] h-[88vh] rounded-2xl border border-slate-800 bg-slate-900/60 shadow-2xl backdrop-blur flex flex-col overflow-hidden">
				{/* content area */}
				<div className="flex-1 min-h-0 p-4 flex flex-col">
					{/* Header */}
					<header className="mb-3 text-center">
						<h1 className="text-2xl font-semibold text-yellow-400">
							Dobby Chef AI
						</h1>
						<p className="text-sm text-slate-400">
							Turn your ingredients and preferences into tasty recipes.
						</p>
					</header>

					{/* Chat: the ONLY scroll area */}
					<section
						ref={chatRef}
						className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60"
						aria-live="polite"
						aria-label="Chat messages">
						{/* Inner wrapper provides spacing */}
						<div className="flex flex-col gap-3 p-3 pb-8 sm:gap-2">
							{messages}
							{/* tiny spacer so last message isn't glued to the border */}
							<div className="h-2" />
						</div>
					</section>
				</div>

				{/* Bottom bar (no strange gap) */}
				<form
					onSubmit={onSubmit}
					className="border-t border-slate-800 bg-slate-900/70 p-3 grid grid-cols-[1fr_0.6fr_auto] gap-2
               md:grid-cols-[1fr_0.6fr_auto] sm:grid-cols-1">
					<input
						value={ings}
						onChange={(e) => setIngs(e.target.value)}
						rows={1}
						required
						placeholder="Ingredients (Rice, Tomato, Chicken)"
						className="h-11 rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm
                 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
					/>

					<input
						value={prefs}
						onChange={(e) => setPrefs(e.target.value)}
						placeholder="Preferences (Veg, Indian, Baked, Non-Fried)"
						className="h-11 rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm
                 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none sm:w-full"
					/>

					<button
						type="submit"
						disabled={busy}
						className="h-11 rounded-lg bg-yellow-400 px-5 text-sm font-semibold text-slate-900
                 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60 sm:w-full">
						Send
					</button>
				</form>
			</main>
		</div>
	);
}
