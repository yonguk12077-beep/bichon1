# Supabase 배포 설정

팬페이지의 일정과 팬아트는 Supabase 공용 저장소에 저장됩니다. 그래서 한 사람이 올린 일정/팬아트가 다른 사람에게도 보입니다.

## 1. Supabase 프로젝트 설정

1. Supabase에서 프로젝트를 생성합니다.
2. SQL Editor에서 `supabase/schema.sql` 전체를 실행합니다.
3. Settings > API에서 Project URL과 service_role key를 복사합니다.

## 2. Vercel 환경 변수

Vercel 프로젝트의 Settings > Environment Variables에 아래 값을 추가합니다.

| 변수 | 값 |
| --- | --- |
| `SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key |

추가 후 반드시 Redeploy 해야 반영됩니다.

## 3. 로컬 확인

Vite 개발 서버만 켜면 Vercel API 경로가 같이 실행되지 않습니다. 공용 저장까지 확인하려면 Vercel 환경 변수와 함께 `vercel dev`로 확인하는 쪽이 가장 정확합니다.

## 4. 동작 요약

- 모든 방문자가 같은 일정과 팬아트 목록을 봅니다.
- 새 일정 저장, 일정 삭제, 팬아트 추가, 팬아트 삭제가 Supabase에 반영됩니다.
- 직접 추가한 영상 링크는 아직 개인 브라우저 저장을 사용합니다.
