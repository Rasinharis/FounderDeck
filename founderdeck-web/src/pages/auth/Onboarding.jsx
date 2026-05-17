import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuthStore } from '../../store/useAuthStore';
import { BriefcaseBusiness, Code2, Loader2, UserRoundCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [form, setForm] = useState({
    name: user?.name ?? '',
    bio: user?.bio ?? '',
    linkedin_url: user?.linkedin_url ?? '',
    github_url: user?.github_url ?? '',
    avatar_url: user?.avatar_url ?? '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const dashboardPath = user?.role === 'entrepreneur' ? '/dashboard/entrepreneur' : '/dashboard/investor';

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        ...form,
        profile_completed: true,
        linkedin_url: form.linkedin_url || null,
        github_url: form.github_url || null,
        avatar_url: form.avatar_url || null,
      };
      const { data } = await api.patch('/profile', payload);
      setUser(data.data);
      toast.success('Profile saved');
      navigate(dashboardPath, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#EAEAEA] px-4 pt-8 pb-12 text-[#111111]">
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3 border-b border-black/5 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF5C00]/10 shrink-0">
            <UserRoundCheck className="h-6 w-6 text-[#FF5C00]" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-black text-[#111111] uppercase tracking-tight">Complete your profile</h1>
            <p className="text-sm font-semibold text-gray-500">Add the links investors and founders need to trust your profile.</p>
          </div>
        </div>

        <div className="grid gap-5">
          <label>
            <span className="mb-2 block text-sm font-bold text-gray-700">Display Name</span>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="appearance-none block w-full px-3 py-2.5 border border-black/5 bg-[#F4F4F4] rounded-xl placeholder-gray-400 text-gray-800 font-semibold focus:outline-none focus:ring-1 focus:ring-[#FF5C00] focus:border-[#FF5C00] transition-shadow sm:text-sm"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-bold text-gray-700">Bio</span>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={5}
              className="appearance-none block w-full px-3 py-2.5 border border-black/5 bg-[#F4F4F4] rounded-xl placeholder-gray-400 text-gray-800 font-semibold focus:outline-none focus:ring-1 focus:ring-[#FF5C00] focus:border-[#FF5C00] transition-shadow sm:text-sm leading-relaxed"
              placeholder="Tell people what you build, invest in, or want to collaborate on."
            />
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <label>
              <span className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700">
                <BriefcaseBusiness className="h-4 w-4 text-[#FF5C00]" /> LinkedIn URL
              </span>
              <input
                name="linkedin_url"
                value={form.linkedin_url}
                onChange={handleChange}
                className="appearance-none block w-full px-3 py-2.5 border border-black/5 bg-[#F4F4F4] rounded-xl placeholder-gray-400 text-gray-800 font-semibold focus:outline-none focus:ring-1 focus:ring-[#FF5C00] focus:border-[#FF5C00] transition-shadow sm:text-sm"
                placeholder="https://linkedin.com/in/username"
              />
            </label>

            <label>
              <span className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700">
                <Code2 className="h-4 w-4 text-[#FF5C00]" /> GitHub URL
              </span>
              <input
                name="github_url"
                value={form.github_url}
                onChange={handleChange}
                className="appearance-none block w-full px-3 py-2.5 border border-black/5 bg-[#F4F4F4] rounded-xl placeholder-gray-400 text-gray-800 font-semibold focus:outline-none focus:ring-1 focus:ring-[#FF5C00] focus:border-[#FF5C00] transition-shadow sm:text-sm"
                placeholder="https://github.com/username"
              />
            </label>
          </div>

          <label>
            <span className="mb-2 block text-sm font-bold text-gray-700">Avatar URL</span>
            <input
              name="avatar_url"
              value={form.avatar_url}
              onChange={handleChange}
              className="appearance-none block w-full px-3 py-2.5 border border-black/5 bg-[#F4F4F4] rounded-xl placeholder-gray-400 text-gray-800 font-semibold focus:outline-none focus:ring-1 focus:ring-[#FF5C00] focus:border-[#FF5C00] transition-shadow sm:text-sm"
              placeholder="https://..."
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#FF5C00] hover:bg-[#E65300] shadow-md shadow-[#FF5C00]/15 px-6 py-3.5 font-bold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving && <Loader2 className="h-5 w-5 animate-spin" />}
            <span>Save and Continue</span>
          </button>
        </div>
      </form>
    </main>
  );
}
