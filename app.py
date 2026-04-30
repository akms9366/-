import re
import os
import anthropic
import streamlit as st
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
from dotenv import load_dotenv

load_dotenv()

PREFERRED_LANGS = ["ja", "en", "en-US", "en-GB"]


def extract_video_id(url: str) -> str | None:
    patterns = [
        r"(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([A-Za-z0-9_-]{11})",
        r"youtube\.com/shorts/([A-Za-z0-9_-]{11})",
    ]
    for pattern in patterns:
        m = re.search(pattern, url)
        if m:
            return m.group(1)
    return None


def fetch_transcript(video_id: str) -> tuple[list[dict], str]:
    """Return (transcript_entries, language_code)."""
    transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)

    # Try preferred languages first
    for lang in PREFERRED_LANGS:
        try:
            t = transcript_list.find_transcript([lang])
            return t.fetch(), t.language_code
        except NoTranscriptFound:
            continue

    # Fall back to any available transcript
    for t in transcript_list:
        return t.fetch(), t.language_code

    raise NoTranscriptFound(video_id, PREFERRED_LANGS)


def entries_to_raw_text(entries: list[dict]) -> str:
    lines = []
    for e in entries:
        start = int(e["start"])
        m, s = divmod(start, 60)
        h, m = divmod(m, 60)
        timestamp = f"[{h:02d}:{m:02d}:{s:02d}]" if h else f"[{m:02d}:{s:02d}]"
        text = e["text"].replace("\n", " ").strip()
        lines.append(f"{timestamp} {text}")
    return "\n".join(lines)


def entries_to_plain_text(entries: list[dict]) -> str:
    return " ".join(e["text"].replace("\n", " ").strip() for e in entries)


def format_as_script(raw_text: str, language_code: str) -> str:
    """Use Claude to convert raw transcript into a readable script with prompt caching."""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY が設定されていません。")

    client = anthropic.Anthropic(api_key=api_key)

    lang_hint = "日本語" if language_code.startswith("ja") else "英語"

    system_prompt = (
        "あなたはYouTube動画の文字起こしテキストをプロの台本形式に整形するアシスタントです。\n"
        "以下のルールに従って整形してください：\n"
        "1. タイムスタンプ付きの断片的なテキストを、自然な文章として結合する\n"
        "2. 話し言葉を読みやすい書き言葉に整える（意味は変えない）\n"
        "3. 内容をセクションに分け、各セクションに見出しを付ける\n"
        "4. フィラー語（「えー」「あの」「まあ」など）は除去する\n"
        "5. 重要なキーワードや強調したい箇所は**太字**にする\n"
        "6. 台本全体の冒頭に「## 概要」セクションとして3〜5行の要約を付ける\n"
        "7. 出力はMarkdown形式にする\n"
        f"8. 動画の言語は{lang_hint}です。出力は日本語で行うこと\n"
    )

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        system=[
            {
                "type": "text",
                "text": system_prompt,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[
            {
                "role": "user",
                "content": (
                    "以下のYouTube動画の文字起こしテキストを台本形式に整形してください。\n\n"
                    f"```\n{raw_text}\n```"
                ),
            }
        ],
    )

    return message.content[0].text


# ── Streamlit UI ──────────────────────────────────────────────────────────────

st.set_page_config(
    page_title="YouTube 文字起こし & 台本ジェネレーター",
    page_icon="🎬",
    layout="wide",
)

st.title("🎬 YouTube 文字起こし & 台本ジェネレーター")
st.caption("YouTubeのURLを入力するだけで、文字起こしと読みやすい台本を自動生成します。")

with st.sidebar:
    st.header("⚙️ 設定")
    api_key_input = st.text_input(
        "Anthropic API Key",
        type="password",
        value=os.getenv("ANTHROPIC_API_KEY", ""),
        help="claude.ai または console.anthropic.com で取得したAPIキーを入力してください。",
    )
    if api_key_input:
        os.environ["ANTHROPIC_API_KEY"] = api_key_input

    st.divider()
    st.markdown(
        "**使い方**\n"
        "1. APIキーを入力（または `.env` に設定）\n"
        "2. YouTube URLを貼り付ける\n"
        "3. 「生成する」をクリック\n"
        "4. 文字起こし・台本をコピーして活用！"
    )

url_input = st.text_input(
    "YouTube URL",
    placeholder="https://www.youtube.com/watch?v=...",
    label_visibility="visible",
)

generate_btn = st.button("▶ 生成する", type="primary", use_container_width=True)

if generate_btn:
    if not url_input.strip():
        st.warning("URLを入力してください。")
        st.stop()

    if not os.getenv("ANTHROPIC_API_KEY"):
        st.error("サイドバーで Anthropic API Key を入力してください。")
        st.stop()

    video_id = extract_video_id(url_input.strip())
    if not video_id:
        st.error("有効なYouTube URLが認識できませんでした。URLを確認してください。")
        st.stop()

    with st.status("処理中...", expanded=True) as status:
        st.write("📥 文字起こしデータを取得中...")
        try:
            entries, lang_code = fetch_transcript(video_id)
        except TranscriptsDisabled:
            status.update(label="エラー", state="error")
            st.error("この動画では文字起こしが無効になっています。")
            st.stop()
        except NoTranscriptFound:
            status.update(label="エラー", state="error")
            st.error("この動画の文字起こしが見つかりませんでした。")
            st.stop()
        except Exception as e:
            status.update(label="エラー", state="error")
            st.error(f"文字起こし取得中にエラーが発生しました: {e}")
            st.stop()

        raw_text = entries_to_raw_text(entries)
        plain_text = entries_to_plain_text(entries)
        st.write(f"✅ 文字起こし取得完了（言語: `{lang_code}`、{len(entries)} セグメント）")

        st.write("✍️ Claudeが台本を生成中...")
        try:
            script = format_as_script(plain_text, lang_code)
        except ValueError as e:
            status.update(label="エラー", state="error")
            st.error(str(e))
            st.stop()
        except Exception as e:
            status.update(label="エラー", state="error")
            st.error(f"台本生成中にエラーが発生しました: {e}")
            st.stop()

        status.update(label="完了！", state="complete", expanded=False)

    st.divider()

    tab_script, tab_transcript = st.tabs(["📝 整形済み台本", "🔤 生の文字起こし"])

    with tab_script:
        st.markdown(script)
        st.download_button(
            label="⬇ 台本をダウンロード (.md)",
            data=script,
            file_name=f"script_{video_id}.md",
            mime="text/markdown",
        )

    with tab_transcript:
        st.text_area(
            "タイムスタンプ付き文字起こし",
            value=raw_text,
            height=400,
            label_visibility="collapsed",
        )
        st.download_button(
            label="⬇ 文字起こしをダウンロード (.txt)",
            data=raw_text,
            file_name=f"transcript_{video_id}.txt",
            mime="text/plain",
        )
