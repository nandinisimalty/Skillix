import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  Briefcase, 
  Code, 
  Award, 
  CheckCircle2, 
  AlertCircle,
  Save,
  Sparkles
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Navbar } from '../components/common/Navbar';


const TARGET_ROLES = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Data Analyst',
  'Data Scientist',
  'Machine Learning Engineer',
  'AI Engineer',
  'Full Stack Developer',
  'DevOps Engineer',
  'Other'
];

const EXPERIENCE_LEVELS = [
  'Student / Fresh Graduate',
  'Entry Level (0-1 yrs)',
  'Junior (1-3 yrs)',
  'Mid-Level (3+ yrs)'
];

export const ProfilePage = () => {
  const { userProfile, updateProfileData } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [degree, setDegree] = useState('');
  const [gradYear, setGradYear] = useState('2026');
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [skills, setSkills] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Student / Fresh Graduate');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setCollege(userProfile.college || '');
      setDegree(userProfile.degree || '');
      setGradYear(userProfile.gradYear || '2026');
      setTargetRole(userProfile.targetRole || 'Software Engineer');
      setSkills(userProfile.skills || 'Python, JavaScript, React, SQL');
      setExperienceLevel(userProfile.experienceLevel || 'Student / Fresh Graduate');
    }
  }, [userProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!name || !targetRole) {
      setMessage({ type: 'error', text: 'Name and Target Job Role are required.' });
      return;
    }

    try {
      setLoading(true);
      await updateProfileData({
        name,
        college,
        degree,
        gradYear,
        targetRole,
        skills,
        experienceLevel,
        updatedAt: new Date().toISOString()
      });
      setMessage({ type: 'success', text: 'Profile saved successfully!' });
      setTimeout(() => {
        navigate('/dashboard');
      }, 1200);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        
        {/* Header */}
        <div className="mb-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Personalized AI Customization</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">User Profile Setup</h1>
            <p className="text-sm text-slate-500 mt-1">
              Help Skillix tailor your interview questions, resume reviews, and study plans.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            Skip to Dashboard
          </Button>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-xl border text-sm flex items-center gap-2.5 ${
            message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        <Card className="p-6 sm:p-8 shadow-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Section 1: Basic Information */}
            <div className="border-b border-slate-200 pb-6">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                Basic Details
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Job Role *</label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <select
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all"
                    >
                      {TARGET_ROLES.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Education Details */}
            <div className="border-b border-slate-200 pb-6">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                Academic Background
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">College or University</label>
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g. Stanford University / Tech Institute"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Graduation Year</label>
                  <select
                    value={gradYear}
                    onChange={(e) => setGradYear(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all"
                  >
                    {['2024', '2025', '2026', '2027', '2028', '2029'].map((yr) => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Degree or Major / Branch</label>
                  <input
                    type="text"
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    placeholder="e.g. B.Tech Computer Science & Engineering"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Skills & Experience */}
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-600" />
                Technical Skills & Experience
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Key Technical Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="e.g. Python, React, JavaScript, SQL, C++, Data Structures"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Gemini AI will prioritize questions aligned with these tech stacks.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Experience Level</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all"
                  >
                    {EXPERIENCE_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-200">
              <Button
                type="submit"
                size="lg"
                isLoading={loading}
                icon={Save}
                className="w-full sm:w-auto"
              >
                Save Profile & Continue
              </Button>
            </div>

          </form>
        </Card>

      </main>
    </div>
  );
};
