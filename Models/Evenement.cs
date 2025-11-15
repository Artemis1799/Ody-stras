using System;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace t5_back.Models
{
    public class Evenement
    {
        [Key]
        public Guid UUID { get; set; }
        
        [Required]
        [MaxLength(255)]
        public string Nom { get; set; } = string.Empty;
        
        public string Description { get; set; } = string.Empty;
        
        public DateTime? Date_debut { get; set; }
        
        [Required]
        public EvenementStatus Status { get; set; }
        
        public Guid? Responsable { get; set; }
        
        [JsonIgnore]
        public ICollection<Point>? Points { get; set; }
    }
}