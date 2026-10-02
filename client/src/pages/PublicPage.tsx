import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Check, Clock, MapPin, User } from 'lucide-react';
import { api, errorMessage } from '../api';
import Logo from '../components/Logo';
import { Button, buttonClass, Card, Field, inputClass } from '../components/ui';
import { todayISO } from '../utils';

type Form = { name: string; dateOfBirth: string; birthTime: string; birthPlace: string };
const empty: Form = { name: '', dateOfBirth: '', birthTime: '', birthPlace: '' };

function validate(f: Form): Partial<Record<keyof Form, string>> {
  const e: Partial<Record<keyof Form, string>> = {};
  if (!f.name.trim()) e.name = 'Please enter your full name';
  if (!f.dateOfBirth) e.dateOfBirth = 'Please select your date of birth';
  else if (f.dateOfBirth > todayISO()) e.dateOfBirth = 'Date of birth cannot be in the future';
  if (!f.birthTime) e.birthTime = 'Please select your time of birth';
  if (!f.birthPlace.trim()) e.birthPlace = 'Please enter your birth place';
  return e;
}

export default function PublicPage() {
  const [form, setForm] = useState<Form>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [done, setDone] = useState(false);

  const set = (k: keyof Form) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) return;
    setSubmitting(true);
    try {
      await api.post('/public/clients', form);
      setDone(true);
      setForm(empty);
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const err = (k: keyof Form) => ({ 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `${k}-error` : undefined });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-brand-50/60 to-canvas">
      <header className="flex items-center justify-between px-4 sm:px-8 h-16">
        <Logo />
        <Link to="/admin/login" className={buttonClass('secondary', 'h-10 px-4')}>Admin Login</Link>
      </header>

      <main className="flex-1 grid place-items-center px-4 py-8 sm:py-12">
        <Card className="w-full max-w-md p-6 sm:p-8">
          {done ? (
            <div className="text-center py-4" role="status">
              <span className="mx-auto grid place-items-center size-16 rounded-full bg-green-50 text-ok"><Check className="size-8" strokeWidth={3} aria-hidden /></span>
              <h1 className="mt-5 text-2xl font-bold tracking-tight">✓ Successfully Submitted</h1>
              <p className="mt-2 text-muted">Your birth details have been successfully submitted.</p>
              <p className="text-muted">Thank you.</p>
              <Button variant="secondary" className="mt-7" onClick={() => setDone(false)}>Submit Another Response</Button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold tracking-tight">Enter your birth details</h1>
              <p className="mt-1.5 text-muted">Share your details with the astrologer. It only takes a few seconds.</p>

              <form onSubmit={onSubmit} noValidate className="mt-7 space-y-5">
                <Field label="Full Name" htmlFor="name" error={errors.name}>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-gray-400" aria-hidden />
                    <input id="name" type="text" autoComplete="name" maxLength={100} placeholder="Enter your full name"
                      value={form.name} onChange={set('name')} className={inputClass(!!errors.name)} {...err('name')} />
                  </div>
                </Field>

                <Field label="Date of Birth" htmlFor="dob" error={errors.dateOfBirth}>
                  <div className="relative">
                    <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-gray-400 pointer-events-none" aria-hidden />
                    <input id="dob" type="date" max={todayISO()} min="1900-01-01" value={form.dateOfBirth} onChange={set('dateOfBirth')}
                      className={inputClass(!!errors.dateOfBirth)} {...err('dateOfBirth')} />
                  </div>
                </Field>

                <Field label="Time of Birth" htmlFor="tob" error={errors.birthTime}>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-gray-400 pointer-events-none" aria-hidden />
                    <input id="tob" type="time" value={form.birthTime} onChange={set('birthTime')}
                      className={inputClass(!!errors.birthTime)} {...err('birthTime')} />
                  </div>
                </Field>

                <Field label="Place of Birth" htmlFor="pob" error={errors.birthPlace}>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-gray-400" aria-hidden />
                    <input id="pob" type="text" maxLength={120} placeholder="Enter your birth place"
                      value={form.birthPlace} onChange={set('birthPlace')} className={inputClass(!!errors.birthPlace)} {...err('birthPlace')} />
                  </div>
                </Field>

                {formError && <p role="alert" className="rounded-xl bg-red-50 text-bad text-sm px-4 py-3">{formError}</p>}

                <Button type="submit" loading={submitting} className="w-full h-12 text-base">
                  {submitting ? 'Submitting...' : 'Submit Details'}
                </Button>
              </form>
            </>
          )}
        </Card>
      </main>

      <footer className="py-6 text-center text-sm text-muted">© {new Date().getFullYear()} SriAstro</footer>
    </div>
  );
}
