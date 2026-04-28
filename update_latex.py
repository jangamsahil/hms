import sys

file_path = r"c:\Users\HP\OneDrive\Desktop\HMS\MediX_Internship_Report.tex"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Paragraph replacements (do this before changing "Filesure" to "Oppidan")
old_p1 = r"is a leading technology-driven company specializing in digital document management and workflow automation solutions. Headquartered in Mumbai, Maharashtra, the organization operates as a product-based SaaS (Software as a Service) company, delivering innovative platforms that enable businesses to securely manage, store, and process large volumes of documents in a digital ecosystem."
new_p1 = r"is an innovative organization focusing on software development, AI education, and related technological fields. Headquartered in Chinchwad, Maharashtra, the organization provides project-based learning and real-world project experiences for emerging engineers and developers."

old_p2 = r"The company focuses on transforming traditional document handling processes into efficient, paperless workflows by leveraging modern web technologies, cloud infrastructure, and automation tools. Filesure serves clients across multiple domains including finance, banking, insurance, and enterprise sectors, helping organizations enhance operational efficiency, ensure data security, and achieve regulatory compliance."
new_p2 = r"The company focuses on delivering robust full-stack solutions and training programs by leveraging modern web technologies, cloud infrastructure, and AI tools. Oppidan India Group equips its interns with industry-standard practices, empowering them to build scalable applications and contribute effectively to enterprise-level projects."

old_p3 = r"The core product of Filesure India Limited is a comprehensive digital document management system that integrates features such as secure storage, intelligent search, workflow automation, and real-time analytics. The platform is designed to handle high-scale enterprise requirements while maintaining performance, reliability, and scalability."
new_p3 = r"The core focus of Oppidan India Group involves real-world product development where modern development methodologies are actively followed. The organization ensures that its technical solutions and project-based assignments are designed to handle high-scale requirements while maintaining performance, reliability, and scalability."

content = content.replace(old_p1, new_p1)
content = content.replace(old_p2, new_p2)
content = content.replace(old_p3, new_p3)

# Personal details
content = content.replace("ANIKET LAXMAN ZIMANE", "JANGAM SAHIL SANTOSH")
content = content.replace("Aniket Laxman Zimane", "Jangam Sahil Santosh")
content = content.replace("13372", "13215")
content = content.replace("Division: C", "Year: 3rd Year")
content = content.replace("Division C", "3rd Year")

# Coordinators & Supervisors
content = content.replace("Mr. Sachin Kadam", "Mrs. Anita Shinkar")
content = content.replace("Prof. Poonam Sadafal", "Mrs. Anita Shinkar")
content = content.replace("Mr. Tushar Mohite", "Mr. Jayesh Chaudhari")
content = content.replace("CEO", "CTO")

# Company details
content = content.replace("Filesure India Limited", "Oppidan India Group")
content = content.replace("Filesure", "Oppidan")
content = content.replace("tushar@filesure.in", "oppidanindia@gmail.com")
content = content.replace("9619156719", "-")
content = content.replace("filesure_logo.jpeg", "oppidan_logo.jpeg") 

# Images
content = content.replace("img/_Offer Letter for Aniket Zimane-Filesure.docx (1)_page-0001.jpg", "img/Offer_Letter.jpeg")
content = content.replace("img/Aniket Experience Letter.docx_page-0001.jpg", "img/Internship_Certificate.jpeg")
content = content.replace("img/_Aniket's LOR.docx_page-0001.jpg", "img/LOR.jpeg")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Replaced successfully")
