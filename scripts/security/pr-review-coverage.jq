[
  .[][]
  | select(
      .commit_id == $head
      and (.user.login | IN("coderabbitai[bot]", "codeant-ai[bot]", "chatgpt-codex-connector[bot]"))
    )
]
| sort_by([.user.login, .submitted_at, .id])
| group_by(.user.login)
| map(last)
| map(select(.state != "DISMISSED"))
| map({user: .user.login, state})
