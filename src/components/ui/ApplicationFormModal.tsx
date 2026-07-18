import { useState, useRef, useEffect } from 'react';
import { X, User, Phone, FileText, Upload, CheckCircle, Loader2, AlertCircle, Mail, Briefcase, GraduationCap } from 'lucide-react';
import { supabase } from '../../lib/supabase';

/* ──────────────────────────────────────────────
   Props
   ────────────────────────────────────────────── */
export interface ApplicationFormModalProps {
  open: boolean;
  onClose: () => void;
  type: 'internship' | 'workshop';
  programId: string;
  programName: string;
  price?: number | null;
  currency?: string;
  priceType?: 'free' | 'paid';
  onSuccess?: () => void;
}

type Step = 'form' | 'submitting' | 'success';
type ApplicantStatus = 'student' | 'working' | '';

const ACCEPTED_RESUME = '.pdf,.png,.jpg,.jpeg';
const ACCEPTED_COVER  = '.pdf,.png,.jpg,.jpeg';
const MAX_FILE_SIZE_MB = 5;
const CONVENIENCE_FEE = 3;

export default function ApplicationFormModal({
  open, onClose, type, programId, programName, price, currency = 'INR', priceType = 'free', onSuccess,
}: ApplicationFormModalProps) {
  /* ── state ── */
  const [step, setStep] = useState<Step>('form');

  // Personal
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [emailConfirm, setEmailConfirm] = useState('');
  const [phone, setPhone] = useState('');

  // Status
  const [applicantStatus, setApplicantStatus] = useState<ApplicantStatus>('');

  // Student fields
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');

  // Working fields
  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('');

  // Files
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef  = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Reset when opened
  useEffect(() => {
    if (open) {
      setStep('form');
      setFullName(''); setEmail(''); setEmailConfirm(''); setPhone('');
      setApplicantStatus(''); setCollege(''); setBranch(''); setYear('');
      setCompanyName(''); setPosition('');
      setResumeFile(null); setCoverFile(null); setCoverLetter('');
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const displayPrice = price ? price + CONVENIENCE_FEE : price;

  /* ── helpers ── */
  const validateFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File too large. Max ${MAX_FILE_SIZE_MB}MB.`);
      return false;
    }
    return true;
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { data, error: uploadErr } = await supabase.storage.from('resumes').upload(path, file, { upsert: true });
    if (uploadErr) { setError('File upload failed: ' + uploadErr.message); return null; }
    const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(data.path);
    return publicUrl;
  };

  /* ── Validate form ── */
  const validateForm = (): boolean => {
    if (!fullName.trim()) { setError('Full name is required.'); return false; }
    if (!email.trim()) { setError('Email address is required.'); return false; }
    if (!emailConfirm.trim()) { setError('Please confirm your email address.'); return false; }
    if (email.trim().toLowerCase() !== emailConfirm.trim().toLowerCase()) {
      setError('Email addresses do not match. Please re-check.');
      return false;
    }
    if (!phone.trim()) { setError('Phone number is required.'); return false; }
    if (!applicantStatus) { setError('Please select whether you are a student or working professional.'); return false; }
    if (applicantStatus === 'student') {
      if (!college.trim()) { setError('College/University name is required.'); return false; }
      if (!branch.trim()) { setError('Branch/Department is required.'); return false; }
      if (!year.trim()) { setError('Year of study is required.'); return false; }
    }
    if (applicantStatus === 'working') {
      if (!companyName.trim()) { setError('Company name is required.'); return false; }
      if (!position.trim()) { setError('Current position is required.'); return false; }
    }
    if (!resumeFile) { setError('Please upload your resume/CV.'); return false; }
    return true;
  };

  /* ── Submit Application ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;

    setLoading(true);
    setStep('submitting');

    try {
      // 1. Upload resume
      const resumeUrl = await uploadFile(resumeFile!, 'applications');
      if (!resumeUrl) { setStep('form'); setLoading(false); return; }

      // 2. Upload cover letter file (optional)
      let coverLetterUrl: string | null = null;
      if (coverFile) {
        coverLetterUrl = await uploadFile(coverFile, 'cover-letters');
      }

      // 3. Build cover letter text
      const coverLetterContent = coverLetterUrl
        ? `[File: ${coverLetterUrl}]\n\n${coverLetter}`
        : coverLetter || null;

      // 4. Submit via RPC
      const { data: result, error: submitErr } = await supabase.rpc('submit_application', {
        p_type: type,
        p_program_id: programId,
        p_full_name: fullName.trim(),
        p_email: email.trim().toLowerCase(),
        p_phone: phone.trim(),
        p_resume_url: resumeUrl,
        p_cover_letter: coverLetterContent,
        p_price_type: priceType || 'free',
        p_applicant_status: applicantStatus,
        p_college: applicantStatus === 'student' ? college.trim() : null,
        p_branch: applicantStatus === 'student' ? branch.trim() : null,
        p_year: applicantStatus === 'student' ? year.trim() : null,
        p_company_name: applicantStatus === 'working' ? companyName.trim() : null,
        p_position: applicantStatus === 'working' ? position.trim() : null,
      });

      if (submitErr) {
        if (submitErr.code === '23505') setError('You have already applied/registered for this program.');
        else setError('Failed to submit application: ' + submitErr.message);
        setStep('form');
        setLoading(false);
        return;
      }

      const { applicationId, studentId } = result as { applicationId: string; studentId: string };

      if (type === 'workshop' && priceType === 'paid' && price && price > 0) {
        await initiateRazorpay(applicationId, studentId, email);
      } else {
        setStep('success');
        setLoading(false);
        onSuccess?.();
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred. Please try again.');
      setStep('form');
      setLoading(false);
    }
  };

  /* ── Razorpay Checkout ── */
  const initiateRazorpay = async (applicationId: string, studentId: string, userEmail: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/razorpay-create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ workshopId: programId, studentId, applicationId }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.orderId) {
        setError(orderData.error || 'Failed to create payment order.');
        setStep('form');
        setLoading(false);
        return;
      }

      const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID || orderData.keyId;
      if (!razorpayKeyId || !window.Razorpay) {
        setError('Payment gateway not available. Please try again later.');
        setStep('form');
        setLoading(false);
        return;
      }

      const options = {
        key: razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency || currency,
        name: 'Praxis Group',
        description: programName,
        order_id: orderData.orderId,
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          await supabase.from('workshop_applications').update({
            status: 'paid',
            payment_status: 'successful',
          }).eq('id', applicationId);

          await supabase.from('payments').insert({
            student_id: studentId,
            workshop_application_id: applicationId,
            amount: (orderData.amount || 0) / 100,
            currency: orderData.currency || currency,
            status: 'successful',
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
          });

          setStep('success');
          setLoading(false);
          onSuccess?.();
        },
        modal: {
          ondismiss: () => {
            setError('Payment was cancelled. Your application is saved — you can retry payment.');
            setStep('form');
            setLoading(false);
          },
        },
        prefill: {
          name: fullName,
          email: userEmail,
          contact: phone,
        },
        theme: {
          color: '#c8a951',
        },
      } as any;

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      setError('Payment initiation failed. Please try again.');
      setStep('form');
      setLoading(false);
    }
  };

  /* ── Input class helper ── */
  const inputClass = 'w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/25 transition-all';

  /* ── Render ── */
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget && step !== 'submitting') onClose(); }}>
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl overflow-hidden animate-fade-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">
              {type === 'internship' ? 'Apply for Internship' : 'Register for Workshop'}
            </h2>
            <p className="text-gray-500 text-xs mt-0.5 truncate max-w-xs">{programName}</p>
          </div>
          {step !== 'submitting' && (
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          )}
        </div>

        <div className="p-5 overflow-y-auto flex-1" ref={formRef}>
          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-900/30 border border-red-500/30 rounded-xl mb-4">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* ── Main Form ── */}
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  <User size={13} className="inline mr-1" /> Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  required type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  className={inputClass} placeholder="Enter your full name" autoFocus
                />
              </div>

              {/* Email (twice) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    <Mail size={13} className="inline mr-1" /> Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    required type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className={inputClass} placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    <Mail size={13} className="inline mr-1" /> Confirm Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    required type="email" value={emailConfirm} onChange={e => setEmailConfirm(e.target.value)}
                    className={`${inputClass} ${emailConfirm && email.toLowerCase() !== emailConfirm.toLowerCase() ? 'border-red-500/50' : ''}`}
                    placeholder="Re-enter your email"
                  />
                  {emailConfirm && email.toLowerCase() !== emailConfirm.toLowerCase() && (
                    <p className="text-red-400 text-xs mt-1">Emails do not match</p>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  <Phone size={13} className="inline mr-1" /> Phone Number <span className="text-red-400">*</span>
                </label>
                <input
                  required type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  className={inputClass} placeholder="+91 98765 43210"
                />
              </div>

              {/* Student / Working Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Status <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setApplicantStatus('student')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                      applicantStatus === 'student'
                        ? 'border-gold-500 bg-gold-500/10 text-gold-500'
                        : 'border-zinc-700 bg-zinc-800/50 text-gray-400 hover:border-zinc-600'
                    }`}
                  >
                    <GraduationCap size={18} /> Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setApplicantStatus('working')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                      applicantStatus === 'working'
                        ? 'border-gold-500 bg-gold-500/10 text-gold-500'
                        : 'border-zinc-700 bg-zinc-800/50 text-gray-400 hover:border-zinc-600'
                    }`}
                  >
                    <Briefcase size={18} /> Working Professional
                  </button>
                </div>
              </div>

              {/* Conditional: Student Fields */}
              {applicantStatus === 'student' && (
                <div className="space-y-3 p-4 bg-zinc-800/30 border border-zinc-700/50 rounded-xl animate-fade-in">
                  <p className="text-xs font-medium text-gold-500 uppercase tracking-wider">Student Details</p>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      College / University <span className="text-red-400">*</span>
                    </label>
                    <input
                      required type="text" value={college} onChange={e => setCollege(e.target.value)}
                      className={inputClass} placeholder="e.g. IIT Delhi"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Branch / Department <span className="text-red-400">*</span>
                      </label>
                      <input
                        required type="text" value={branch} onChange={e => setBranch(e.target.value)}
                        className={inputClass} placeholder="e.g. Computer Science"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Year <span className="text-red-400">*</span>
                      </label>
                      <select
                        required value={year} onChange={e => setYear(e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Select</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                        <option value="5th Year">5th Year</option>
                        <option value="Postgraduate">Postgraduate</option>
                        <option value="PhD">PhD</option>
                        <option value="Graduated">Graduated</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional: Working Professional Fields */}
              {applicantStatus === 'working' && (
                <div className="space-y-3 p-4 bg-zinc-800/30 border border-zinc-700/50 rounded-xl animate-fade-in">
                  <p className="text-xs font-medium text-gold-500 uppercase tracking-wider">Professional Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Company Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        required type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                        className={inputClass} placeholder="e.g. Google"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Position / Role <span className="text-red-400">*</span>
                      </label>
                      <input
                        required type="text" value={position} onChange={e => setPosition(e.target.value)}
                        className={inputClass} placeholder="e.g. Software Engineer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Resume Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  <FileText size={13} className="inline mr-1" /> Resume / CV <span className="text-red-400">*</span>
                </label>
                <div
                  onClick={() => resumeInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-700 hover:border-gold-500/50 rounded-xl p-4 text-center cursor-pointer transition-colors group"
                >
                  {resumeFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle size={16} className="text-emerald-400" />
                      <span className="text-white text-sm font-medium truncate max-w-[200px]">{resumeFile.name}</span>
                      <span className="text-gray-500 text-xs">({(resumeFile.size / 1024 / 1024).toFixed(1)}MB)</span>
                    </div>
                  ) : (
                    <>
                      <Upload size={20} className="text-gray-500 mx-auto mb-1 group-hover:text-gold-500 transition-colors" />
                      <p className="text-gray-400 text-sm">Click to upload resume</p>
                      <p className="text-gray-600 text-xs mt-0.5">PDF, PNG, JPG — Max {MAX_FILE_SIZE_MB}MB</p>
                    </>
                  )}
                </div>
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept={ACCEPTED_RESUME}
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f && validateFile(f)) setResumeFile(f);
                  }}
                />
              </div>

              {/* Cover Letter (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  <FileText size={13} className="inline mr-1" /> Cover Letter <span className="text-gray-600">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={coverLetter}
                  onChange={e => setCoverLetter(e.target.value)}
                  className={`${inputClass} py-2`}
                  placeholder="Write your cover letter here..."
                />
                <div className="mt-2">
                  <button type="button" onClick={() => coverInputRef.current?.click()} className="text-xs text-gray-500 hover:text-gold-500 transition-colors flex items-center gap-1">
                    <Upload size={12} /> Or upload a file
                  </button>
                  {coverFile && (
                    <div className="flex items-center gap-2 mt-1">
                      <CheckCircle size={12} className="text-emerald-400" />
                      <span className="text-white text-xs truncate max-w-[200px]">{coverFile.name}</span>
                      <button type="button" onClick={() => setCoverFile(null)} className="text-red-400 text-xs hover:text-red-300">Remove</button>
                    </div>
                  )}
                </div>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept={ACCEPTED_COVER}
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f && validateFile(f)) setCoverFile(f);
                  }}
                />
              </div>

              {/* Price info for paid workshops */}
              {type === 'workshop' && priceType === 'paid' && displayPrice && displayPrice > 0 && (
                <div className="flex items-center justify-between p-3 bg-gold-500/10 border border-gold-500/20 rounded-xl">
                  <span className="text-gray-300 text-sm">Payment required</span>
                  <span className="text-gold-500 font-bold text-lg">₹{displayPrice.toLocaleString()}</span>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 font-semibold">
                {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> :
                  type === 'workshop' && priceType === 'paid' && displayPrice && displayPrice > 0
                    ? `Pay ₹${displayPrice.toLocaleString()} & Register`
                    : 'Submit Application'}
              </button>

              <p className="text-gray-600 text-xs text-center">
                All fields marked with <span className="text-red-400">*</span> are mandatory
              </p>
            </form>
          )}

          {/* ── Step: Submitting ── */}
          {step === 'submitting' && (
            <div className="py-12 text-center">
              <Loader2 size={40} className="animate-spin text-gold-500 mx-auto mb-4" />
              <p className="text-white font-medium">Processing your application...</p>
              <p className="text-gray-500 text-sm mt-1">Please don't close this window</p>
            </div>
          )}

          {/* ── Step: Success ── */}
          {step === 'success' && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Application Submitted!</h3>
              <p className="text-gray-400 text-sm max-w-xs mx-auto">
                {type === 'internship'
                  ? 'Your internship application has been received. We\'ll notify you via email about next steps.'
                  : 'You have been successfully registered for this workshop. Check your email for details.'}
              </p>
              <button onClick={onClose} className="btn-primary mt-6 px-8 py-2.5">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
