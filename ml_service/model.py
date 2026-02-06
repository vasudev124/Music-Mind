from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import json

_model = None
songs = None
song_embeddings = None

def load_resources():
    global _model, songs, song_embeddings
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")

        with open("songs.json", "r") as f:
            songs = json.load(f)

        song_texts = [song["description"] for song in songs]
        song_embeddings = _model.encode(song_texts)

def search_songs(query, top_k=5):
    load_resources()

    query_embedding = _model.encode([query])
    similarities = cosine_similarity(query_embedding, song_embeddings)[0]

    ranked = sorted(
        zip(songs, similarities),
        key=lambda x: x[1],
        reverse=True
    )

    return [
        {
            "id": song["id"],
            "title": song["title"],
            "artist": song["artist"],
            "score": float(score)
        }
        for song, score in ranked[:top_k]
    ]
