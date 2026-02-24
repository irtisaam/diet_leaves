export default function ContactPage() {
  return (
    <div className="min-h-screen bg-dark py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl font-bold text-white mb-8">Contact Us</h1>
        
        <div className="bg-dark-100 rounded-lg p-12">
          <div className="text-6xl mb-6">📧</div>
          <h2 className="text-2xl font-semibold text-white mb-4">Coming Soon</h2>
          <p className="text-gray-400 max-w-md mx-auto mb-8">
            Our contact form is being set up. In the meantime, feel free to reach out via email.
          </p>
          <a 
            href="mailto:info@dietleaves.pk" 
            className="inline-block btn-primary"
          >
            Email Us
          </a>
        </div>
      </div>
    </div>
  )
}
