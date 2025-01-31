import nodemailer from "nodemailer";

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // This should be an App Password, not your regular Gmail password
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail({ to, subject, text, html }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      text,
      html,
    });
    console.log("Email sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

export function generateAppointmentEmail(appointment: {
  date: Date;
  patient: { name: string; email: string };
  doctor: { name: string; email: string };
  notes?: string;
  isTeleconsultation?: boolean;
  meetingUrl?: string;
}) {
  const dateStr = new Date(appointment.date).toLocaleString();
  const consultationType = appointment.isTeleconsultation ? "Teleconsultation" : "In-person consultation";

  // Email for patient
  const patientEmailHtml = `
    <h2>Appointment Confirmation</h2>
    <p>Dear ${appointment.patient.name},</p>
    <p>Your appointment has been scheduled with Dr. ${appointment.doctor.name}.</p>
    <p><strong>Details:</strong></p>
    <ul>
      <li>Date and Time: ${dateStr}</li>
      <li>Type: ${consultationType}</li>
      ${appointment.meetingUrl ? `<li>Meeting Link: <a href="${appointment.meetingUrl}">${appointment.meetingUrl}</a></li>` : ''}
      ${appointment.notes ? `<li>Notes: ${appointment.notes}</li>` : ''}
    </ul>
    <p>If you need to reschedule or cancel your appointment, please contact us as soon as possible.</p>
    <p>Best regards,<br>Medical Admin Team</p>
  `;

  // Email for doctor
  const doctorEmailHtml = `
    <h2>New Appointment Scheduled</h2>
    <p>Dear Dr. ${appointment.doctor.name},</p>
    <p>A new appointment has been scheduled with patient ${appointment.patient.name}.</p>
    <p><strong>Details:</strong></p>
    <ul>
      <li>Date and Time: ${dateStr}</li>
      <li>Type: ${consultationType}</li>
      ${appointment.meetingUrl ? `<li>Meeting Link: <a href="${appointment.meetingUrl}">${appointment.meetingUrl}</a></li>` : ''}
      ${appointment.notes ? `<li>Notes: ${appointment.notes}</li>` : ''}
    </ul>
    <p>Best regards,<br>Medical Admin Team</p>
  `;

  return {
    patient: {
      to: appointment.patient.email,
      subject: "Appointment Confirmation",
      text: patientEmailHtml.replace(/<[^>]*>/g, ''),
      html: patientEmailHtml,
    },
    doctor: {
      to: appointment.doctor.email,
      subject: "New Appointment Scheduled",
      text: doctorEmailHtml.replace(/<[^>]*>/g, ''),
      html: doctorEmailHtml,
    },
  };
}