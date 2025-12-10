import type React from "react"
import { Zap, Twitter, Instagram, Linkedin, MapPin, Phone, Mail } from "lucide-react"

const Footer: React.FC = () => {
  return (
    <footer className="bg-charcoal-900 border-t border-charcoal-600 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="h-6 w-6 text-voltage fill-voltage" />
              <span className="text-xl font-bold text-white">
                Res<span className="text-voltage">Q</span>
              </span>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed mb-6">
              The smart, all-in-one emergency services platform for motorists. From towing to medical response, we turn
              distress into instant action.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm text-text-secondary">
                <MapPin className="w-4 h-4 text-voltage mt-1 flex-shrink-0" />
                <span>
                  Geometry Ltd
                  <br />
                  Ola Plaza, Muthaiga
                  <br />
                  P.O. Box 64489-00620
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <Phone className="w-4 h-4 text-voltage flex-shrink-0" />
                <span>+254 720 018 427</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <Mail className="w-4 h-4 text-voltage flex-shrink-0" />
                <span>josephwainainamwirigi@gmail.com</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6">Services</h4>
            <ul className="space-y-4 text-sm text-text-secondary">
              <li>
                <a href="#" className="hover:text-voltage transition-colors">
                  Flatbed Towing
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-voltage transition-colors">
                  Ambulance Dispatch
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-voltage transition-colors">
                  Fuel Delivery
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-voltage transition-colors">
                  Vehicle Diagnostics
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-voltage transition-colors">
                  Battery Jumpstart
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-text-secondary">
              <li>
                <a href="#" className="hover:text-voltage transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-voltage transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-voltage transition-colors">
                  Partners
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-voltage transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-text-secondary">
              <li>
                <a href="#" className="hover:text-voltage transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-voltage transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-voltage transition-colors">
                  Non-Disclosure Agreement
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-charcoal-600 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-charcoal-600 text-sm">© 2025 Geometry Ltd. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-charcoal-600 hover:text-voltage transition-colors">
              <Twitter size={20} />
            </a>
            <a href="#" className="text-charcoal-600 hover:text-voltage transition-colors">
              <Instagram size={20} />
            </a>
            <a href="#" className="text-charcoal-600 hover:text-voltage transition-colors">
              <Linkedin size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
