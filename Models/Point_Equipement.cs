using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace t5_back.Models
{
    public class Point_Equipement
    {
        [Required]
        public Guid Point_ID { get; set; }
        
        [Required]
        public Guid Equipement_ID { get; set; }
        
        public int? Quantite { get; set; }
        
        public Guid? CreatedBy { get; set; }
        
        public DateTime Created { get; set; } = DateTime.UtcNow;
        
        [ForeignKey("Point_ID")]
        public Point Point { get; set; }
        
        [ForeignKey("Equipement_ID")]
        public Equipement Equipement { get; set; }
    }
}