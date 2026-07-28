-- Allow admins to view all user_tracker_programs rows (for dashboard stats and monitoring)
-- Users can still only see their own rows (policy from the original migration)

create policy "Admins can view all tracker programs"
  on user_tracker_programs
  for select
  using (auth.jwt() ->> 'email' in (select email from admin_users));
