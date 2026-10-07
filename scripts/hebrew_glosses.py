#!/usr/bin/env python3
"""Generate short Hebrew glosses for every lemma in data/lexicon.json using Claude.

The open lexicons (BDB, Strong's) only have English definitions. This script
asks Claude to write a short Hebrew gloss for each lemma, based on those
definitions and the root, and stores the result in data/glosses-he.json:

    {"559": {"g": "אמר, דיבר", "n": ""}, ...}

  g – a short gloss (one to a few words, senses separated by commas).
  n – an optional short note, e.g. when the biblical sense differs from
      modern Hebrew. Empty when there is nothing to add.

The script is resumable: lemmas that already have a gloss are skipped, so it
can be re-run after an interruption or after new books are added.

Usage (needs ANTHROPIC_API_KEY, or another credential the SDK picks up):
  pip install anthropic
  python3 scripts/hebrew_glosses.py            # Message Batches API (50% cheaper, async)
  python3 scripts/hebrew_glosses.py --direct   # regular requests, results right away
  python3 scripts/hebrew_glosses.py --limit 200 --direct   # try a small sample first
"""
import argparse
import json
import os
import sys
import time

import anthropic
from anthropic.types.message_create_params import MessageCreateParamsNonStreaming
from anthropic.types.messages.batch_create_params import Request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEXICON = os.path.join(ROOT, "data", "lexicon.json")
OUT = os.path.join(ROOT, "data", "glosses-he.json")
BATCH_STATE = os.path.join(ROOT, ".cache", "glosses-batch.json")

MODEL = "claude-opus-5-5"
CHUNK = 60  # lemmas per request

SYSTEM = """You are an expert in Biblical Hebrew lexicography writing for Israeli learners.
For each lemma you get its vocalized form, part of speech, its English definitions from
Brown-Driver-Briggs (BDB) and Strong's, and its root. Write, in Hebrew:

- "g": a short gloss of the word's meaning in the Hebrew Bible, in clear modern Hebrew.
  One to five words. Separate distinct senses with commas, most common sense first.
  Verbs: give the meaning in the qal (or in the binyan the verb is used in) as a past-tense
  3rd person masculine form or infinitive, e.g. "אמר, דיבר" or "ללכת, להתהלך".
  Proper names: say what it names, e.g. "נהר בבבל", "מלך יהודה", "עיר בארץ בנימין".
  Particles and prepositions: describe the function, e.g. "אל, לכיוון".
- "n": an optional short note (up to 15 words) only when it helps a learner: the biblical
  sense differs from modern Hebrew, the word is rare (hapax), or the meaning is uncertain.
  Otherwise an empty string.

Rely on the English definitions; do not invent senses they do not support. If the meaning
is uncertain, say so in "n". Use plain Hebrew letters without niqqud, except where niqqud is
needed to avoid ambiguity. Return exactly one item per input lemma, with the same "id"."""

SCHEMA = {
    "type": "object",
    "properties": {
        "items": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "g": {"type": "string"},
                    "n": {"type": "string"},
                },
                "required": ["id", "g", "n"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["items"],
    "additionalProperties": False,
}

POS = {"V": "verb", "N": "noun", "A": "adjective", "Np": "proper noun", "R": "preposition",
       "D": "adverb", "C": "conjunction"}


def describe(lemma, e):
    """Compact input record for one lemma."""
    rec = {"id": lemma, "word": e.get("w", ""), "lang": "Aramaic" if e.get("lang") == "arc" else "Hebrew"}
    pos = e.get("pos") or ""
    rec["pos"] = POS.get(pos, POS.get(pos[:1], pos))
    if e.get("def"):
        rec["bdb"] = e["def"]
    s = e.get("strong")
    if s and s.get("def"):
        rec["strong"] = s["def"][:200]
    roots = []
    if e.get("bdb", {}).get("root"):
        roots.append(e["bdb"]["root"])
    for r in (s or {}).get("roots", []):
        if r["r"] not in roots:
            roots.append(r["r"])
    if roots:
        rec["root"] = " / ".join(roots)
    return rec


def request_params(chunk, lexicon):
    records = [describe(l, lexicon[l]) for l in chunk]
    return {
        "model": MODEL,
        "max_tokens": 16000,
        "system": SYSTEM,
        "output_config": {"effort": "medium", "format": {"type": "json_schema", "schema": SCHEMA}},
        "messages": [{"role": "user", "content": json.dumps(records, ensure_ascii=False)}],
    }


def parse(message, chunk):
    """Return {lemma: {"g", "n"}} from a response, or None if it is unusable."""
    if message.stop_reason in ("refusal", "max_tokens"):
        return None
    text = next((b.text for b in message.content if b.type == "text"), "")
    try:
        items = json.loads(text)["items"]
    except (json.JSONDecodeError, KeyError, TypeError):
        return None
    wanted = set(chunk)
    return {it["id"]: {"g": it["g"].strip(), "n": it["n"].strip()}
            for it in items if it["id"] in wanted and it["g"].strip()}


def load(path, default):
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    return default


def save(glosses):
    tmp = OUT + ".part"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(glosses, f, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    os.replace(tmp, OUT)


def run_direct(client, chunks, lexicon, glosses):
    for n, chunk in enumerate(chunks, 1):
        params = request_params(chunk, lexicon)
        # Server-side fallback: if the request is declined, another model answers it.
        message = client.beta.messages.create(
            betas=["server-side-fallback-2026-07-01"], fallbacks="default", **params)
        got = parse(message, chunk)
        if got is None:
            print(f"chunk {n}/{len(chunks)}: unusable response ({message.stop_reason}), will retry next run",
                  file=sys.stderr)
            continue
        glosses.update(got)
        save(glosses)
        print(f"chunk {n}/{len(chunks)}: {len(got)}/{len(chunk)} glosses", file=sys.stderr)


def run_batch(client, chunks, lexicon, glosses):
    state = load(BATCH_STATE, None)
    if state:
        print("resuming batch", state["id"], file=sys.stderr)
    else:
        requests = [Request(custom_id=f"chunk-{i}", params=MessageCreateParamsNonStreaming(**request_params(c, lexicon)))
                    for i, c in enumerate(chunks)]
        batch = client.messages.batches.create(requests=requests)
        state = {"id": batch.id, "chunks": chunks}
        os.makedirs(os.path.dirname(BATCH_STATE), exist_ok=True)
        with open(BATCH_STATE, "w", encoding="utf-8") as f:
            json.dump(state, f)
        print("created batch", batch.id, "with", len(requests), "requests", file=sys.stderr)

    while True:
        batch = client.messages.batches.retrieve(state["id"])
        if batch.processing_status == "ended":
            break
        c = batch.request_counts
        print(f"waiting: {c.processing} processing, {c.succeeded} done", file=sys.stderr)
        time.sleep(60)

    failed = []
    for result in client.messages.batches.results(state["id"]):
        chunk = state["chunks"][int(result.custom_id.split("-")[1])]
        got = parse(result.result.message, chunk) if result.result.type == "succeeded" else None
        if got is None:
            failed.append(chunk)
            continue
        glosses.update(got)
    save(glosses)
    os.remove(BATCH_STATE)
    if failed:
        # Batches don't support fallbacks; retry the leftovers as direct requests.
        print(f"{len(failed)} chunks failed in the batch; retrying them directly", file=sys.stderr)
        run_direct(client, failed, lexicon, glosses)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--direct", action="store_true", help="use regular requests instead of the Batches API")
    ap.add_argument("--limit", type=int, default=0, help="only process this many missing lemmas")
    args = ap.parse_args()

    lexicon = load(LEXICON, {})
    glosses = load(OUT, {})
    missing = sorted(l for l in lexicon if l not in glosses and lexicon[l].get("w"))
    if args.limit:
        missing = missing[: args.limit]
    print(f"{len(glosses)} glosses exist, {len(missing)} to generate", file=sys.stderr)
    if not missing and not os.path.exists(BATCH_STATE):
        return
    chunks = [missing[i:i + CHUNK] for i in range(0, len(missing), CHUNK)]

    client = anthropic.Anthropic()
    if args.direct:
        run_direct(client, chunks, lexicon, glosses)
    else:
        run_batch(client, chunks, lexicon, glosses)
    print(f"done: {len(glosses)} glosses in {os.path.relpath(OUT, ROOT)}", file=sys.stderr)


if __name__ == "__main__":
    main()
