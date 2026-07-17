import { useState } from 'react';
import { Mail, Phone, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import SEO from '../components/ui/SEO';
import PublicLayout from '../components/layout/PublicLayout';
import { supabase } from '../lib/supabase';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: err } = await supabase.from('contact_messages').insert({
      name: form.name,
      email: form.email,
      subject: form.subject,
      message: form.message,
    });

    if (err) {
      setError('Failed to send message. Please try again or email us directly.');
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccess(true);
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <PublicLayout>
      <SEO title="Contact Us — Praxis Group" description="Get in touch with Praxis Group for enrollment queries, partnerships, or support. Email, phone, and address details available." />
      <div className="pt-24 pb-12 px-4 bg-dark-700/50 border-b border-dark-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-gold-500 text-sm font-semibold uppercase tracking-wider mb-3">Get in Touch</div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Contact Us</h1>
          <p className="text-gray-400 text-lg max-w-2xl">Have a question, partnership inquiry, or feedback? We'd love to hear from you.</p>
        </div>
      </div>

      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <h2 className="text-2xl font-bold text-white mb-8">Get In Touch</h2>
            <div className="space-y-6 mb-12">
              {[
                { icon: Mail, label: 'Email', value: 'partnerships@praxisgroup.online', sub: 'We respond within 24 hours' },
                { icon: Phone, label: 'Phone', value: '+91 92798 64338', sub: 'Mon–Fri, 9am–6pm IST' },
                { icon: Clock, label: 'Support Hours', value: 'Monday to Friday', sub: '9:00 AM – 6:00 PM IST' },
              ].map(({ icon: Icon, label, value, sub }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gold-600/10 border border-gold-600/20 flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-gold-500" />
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">{label}</div>
                    <div className="text-white font-medium text-sm">{value}</div>
                    <div className="text-gray-500 text-xs">{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card bg-dark-700/50">
              <h3 className="text-white font-semibold mb-3 text-sm">For Students</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                For enrollment queries, certificate issues, or dashboard support, please log in to your student portal and raise a support ticket.
              </p>
              <h3 className="text-white font-semibold mb-3 text-sm">For Companies</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                For partnership and collaboration inquiries, please visit our <a href="/for-companies" className="text-gold-500 hover:underline">For Companies</a> page or email partnerships@praxisgroup.online.
              </p>
            </div>
          </div>

          <div>
            {success ? (
              <div className="card text-center py-16 border-forest-600/30">
                <CheckCircle size={48} className="text-forest-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Message Sent!</h3>
                <p className="text-gray-400 text-sm">We've received your message and will respond within 24 hours.</p>
                <button onClick={() => setSuccess(false)} className="btn-ghost mt-6 px-6 py-2.5 text-sm">Send another message</button>
              </div>
            ) : (
              <div className="card">
                <h3 className="text-xl font-bold text-white mb-6">Send a Message</h3>
                {error && (
                  <div className="mb-4 px-4 py-3 bg-red-600/10 border border-red-600/30 text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Your Name *</label>
                      <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Email Address *</label>
                      <input required type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Subject *</label>
                    <input required className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Message *</label>
                    <textarea required rows={6} className="input resize-none" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-sm">
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
